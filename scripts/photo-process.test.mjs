import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';
import { validatePhotoSuggestion } from '../api/schemas/suggestion.mjs';

// Run the real editor functions and API handler with in-memory persistence.
// This exercises field transport without changing portfolio content or calling AI.
function source(file) {
  return ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
}
function functionCode(parsed, name) {
  const node = parsed.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert.ok(node, `Missing function ${name}`);
  return node.getText(parsed);
}
function editorFunction(name, bindings) {
  const parsed = source('admin/ui/photography.js');
  return vm.runInNewContext(`(${functionCode(parsed, name)})`, bindings);
}
function photoApi(photo) {
  const parsed = source('api/server.mjs');
  let handler;
  const bindings = {
    app: { put: (_route, callback) => { handler = callback; } },
    asyncHandler: callback => callback,
    readData: async () => ({}),
    findCollection: () => ({ collection: { photos: [photo] } }),
    writeData: async () => {},
    recordActivity: async () => {},
    activityContext: () => ({}),
  };
  const route = parsed.statements.find(node => ts.isExpressionStatement(node)
    && ts.isCallExpression(node.expression)
    && node.expression.expression.getText(parsed) === 'app.put'
    && node.expression.arguments[0]?.text === '/api/collections/:slug/photos/:id');
  assert.ok(route);
  vm.runInNewContext(`${functionCode(parsed, 'normalizePhotoProcess')}\n${route.getText(parsed)}`, bindings);
  return async body => {
    let saved;
    await handler({ params: { slug: 'sample', id: photo.id }, body }, { json: value => { saved = value; } });
    return saved;
  };
}

test('AI process draft survives validation, editor application, and explicit save', async () => {
  const draft = validatePhotoSuggestion({title:'Frame', alt:'An arched view', story:'Mountains beyond a window.', process:'  The window opening frames the ridge and adds foreground depth.  ', tags:[]}, []);
  assert.equal(draft.success, true);
  const photo = {id:'frame', title:'Frame'};
  const put = photoApi(photo);
  const field = () => ({value:''});
  const dom = Object.fromEntries(['detailTitle','detailAlt','detailStory','detailProcess','detailAiGuidance','detailLocation','detailFeaturedRank','detailRatio','detailRatioCustom','detailOrient','detailFocalX','detailFocalY'].map(key=>[key,field()]));
  dom.detailAiGuidance.value = 'This is a mosque minaret.';
  let dirty = false;
  const bindings = {dom, activeSlug:'sample', selectedPhotoId:photo.id, photoDraftDirty:false,
    window:{PortfolioAI:{analyzePhoto:async(_slug,_id,controls)=>{assert.equal(controls.guidance, "This is a mosque minaret."); return draft.data;}}},
    selectedTagValues:()=>[], mergeTags:()=>[], renderTags:()=>{}, MAX_PHOTO_TAGS:6,
    markPhotoDraftDirty:()=>{dirty=true;}, toast:()=>{}, console,
    apiPut:async(_url,body)=>put({process:body.process}),
    updatePhotoSaveState:()=>{}, loadData:async()=>{}, loadActivity:async()=>{}, openDetail:()=>{},
  };
  await editorFunction('analyzePhotoWithAI', bindings)();
  assert.equal(dom.detailProcess.value, draft.data.process);
  assert.equal(dirty, true);
  assert.equal(photo.process, undefined, 'AI should leave an unsaved draft');
  await editorFunction('savePhoto', bindings)();
  assert.equal(photo.process, draft.data.process);
  await put({title:'Updated'});
  assert.equal(photo.process, draft.data.process, 'Unrelated edits preserve process');
  await put({process:'   '});
  assert.equal(Object.hasOwn(photo, 'process'), false, 'Blank process clears the field');
});

test('photo process accepts legacy metadata and rejects invalid drafts/saves', async () => {
  const base={title:'Frame',alt:'Window',story:'A mountain view.',tags:[]};
  assert.equal(validatePhotoSuggestion(base, []).success,true);
  assert.equal(validatePhotoSuggestion({...base,process:''}, []).success,true);
  const put=photoApi({id:'frame'});
  for(const process of [42,{},'x'.repeat(1001)]) {
    assert.equal(validatePhotoSuggestion({...base,process}, []).success,false);
    await assert.rejects(put({process}),error=>error.statusCode===400);
  }
  await put({process:null});
});

test('viewer hides missing process and renders only the selected photo note', () => {
  const parsed=source('components/photography/photography-home.tsx');
  let block;
  function visit(node) {
    if(ts.isJsxExpression(node) && node.expression && node.expression.getText(parsed).includes('className="viewer-process"')) block=node.expression;
    ts.forEachChild(node,visit);
  }
  visit(parsed);
  assert.ok(block);
  const code=ts.transpileModule(block.getText(parsed),{compilerOptions:{jsx:ts.JsxEmit.React}}).outputText;
  const collection={skillsDemonstrated:'Unrelated collection process'};
  const React={createElement:(type,props,...children)=>({type,props,children})};
  const render=photo=>vm.runInNewContext(code,{selected:{photo,collection},React});
  assert.equal(render({}),undefined);
  assert.equal(render({process:'   '}),'');
  const rendered=render({process:'The window frames the mountain.'});
  assert.equal(rendered.children[1],'The window frames the mountain.');
});
test('photographer corrections reach the AI request with the per-photo process schema', async () => {
  const parsed=source('api/routes/ai.mjs');
  const photo={id:'minaret',src:'/photography/full/minaret.webp',tags:[]};
  let request;
  const bindings={
    AiServiceError:class extends Error {constructor(message,statusCode){super(message);this.statusCode=statusCode;}},
    imagePart:async()=>({type:'image_url'}), normalizePhotoTags:()=>[],
    loadPrompt:()=>'', PHOTO_FALLBACK_PROMPT:'', TECHNIQUE_TAGS:[], MAX_AI_TAGS:4, MAX_PHOTO_TAGS:6,
    textPart:text=>({type:'text',text}),
    requestStructuredMetadata:async(messages,schema)=>{request={messages,schema};return {};},
  };
  const schema=parsed.statements.flatMap(node=>ts.isVariableStatement(node)?[...node.declarationList.declarations]:[]).find(node=>node.name.getText(parsed)==='PHOTO_SCHEMA');
  const analyze=vm.runInNewContext(`const PHOTO_SCHEMA=${schema.initializer.getText(parsed)}; (${functionCode(parsed,'analyzePhoto').replace(/^export /,'')})`,bindings);
  await analyze({photos:[photo]},photo.id,'This is a mosque minaret; the objects at the top are speakers.');
  assert.match(request.messages[1].content[0].text,/mosque minaret/);
  assert.ok(request.schema.required.includes('process'));
  await assert.rejects(analyze({photos:[photo]},photo.id,42),error=>error.statusCode===400);
  let posted;
  const window={};
  vm.runInNewContext(fs.readFileSync('admin/ui/ai.js','utf8'),{window,fetch:async(_url,options)=>{posted=options;return {ok:true,json:async()=>({})};}});
  await window.PortfolioAI.analyzePhoto('sample',photo.id,{guidance:'This is a mosque minaret.'});
  assert.equal(JSON.parse(posted.body).guidance,'This is a mosque minaret.');
  assert.equal(posted.headers['Content-Type'],'application/json');
});
