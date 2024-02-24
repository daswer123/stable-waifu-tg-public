import {sql} from "./init.js";

export async function createSettingsTables() {
    await sql`
      CREATE SCHEMA IF NOT EXISTS settings;
    `;
    console.log("settings schema ready.");
  // Create models table first


  await sql`
      CREATE TABLE IF NOT EXISTS settings.models (
          model_name TEXT PRIMARY KEY,
          description TEXT,
          img_link TEXT,
          confirm_cymbol TEXT DEFAULT '✅',
          stable_model TEXT,
          is_xl_model BOOLEAN DEFAULT FALSE,
          has_alter_mode BOOLEAN DEFAULT FALSE,
          enable_alter_model BOOLEAN DEFAULT FALSE,
          has_preset BOOLEAN DEFAULT FALSE,
          alter_model_name TEXT DEFAULT '',
          alter_model_link TEXT DEFAULT '',
          alter_model_confirm_cymbol TEXT DEFAULT '',
          alter_model_stable_model TEXT DEFAULT '')
`;
  console.log("Models table ready.");

  // Then create presets table with a foreign key reference to models
  await sql`
          CREATE TABLE IF NOT EXISTS settings.presets(
          model_name TEXT REFERENCES settings.models(model_name),
          preset_name text,
          description text,
          img_link text,
          confirm_cymbol TEXT DEFAULT '✅',
          style_name text,
          is_default boolean default false ,
          is_selected boolean default false ,
          UNIQUE(model_name,preset_name));
`;
  console.log("Presets table ready.");

  // Now proceed with creating other tables

  // Negative Embeddings table
  await sql`
CREATE TABLE IF NOT EXISTS settings.negativeEmb(id SERIAL PRIMARY KEY,name Text);
`;
  console.log("Negative Embedding table ready.");

  // Strength Settings table
  await sql`
CREATE TABLE IF NOT EXISTS settings.strenghtSetting(id SERIAL PRIMARY KEY,name Text,strenght FLOAT8,img_link Text,description Text);
`;
  console.log("Strength Settings table ready.");

  // Aspect Ratio Table
  await sql`
CREATE TABLE IF NOT EXISTS settings.aspectRatio(ratio Text,type Text,resolution Text,img_link Text);
`;

  console.log("Aspect Ratio table ready.");


  await sql`
    CREATE TABLE IF NOT EXISTS settings.magickwords (
      base TEXT,
      prompt_query TEXT,
      lora TEXT,
      lora_neg TEXT DEFAULT ''
    );
  `;

  console.log("Magick words table ready.");

  // Создание таблицы Magick Tags, если она еще не существует
  await sql`
    CREATE TABLE IF NOT EXISTS settings.magicktags (
      base TEXT,
      lora TEXT
    );
  `;

  console.log("Magick Tags table ready.");

  // Создание таблицы Magick Chars, если она еще не существует
  await sql`
    CREATE TABLE IF NOT EXISTS settings.magickchars (
      name TEXT PRIMARY KEY,
      prompt_query TEXT,
      extra TEXT DEFAULT '',
      lora TEXT
    );
  `;
  console.log("Magick chars table ready.");

  // Создание таблицы Magick Chars Extra, если она еще не существует
  await sql`
    CREATE TABLE IF NOT EXISTS settings.magickchars_extra (
      char TEXT REFERENCES settings.magickchars(name) ON DELETE CASCADE,
      costume TEXT,
      prompt TEXT
    );
  `;

  console.log("Magick chars EXTRA table ready.");
}

// TAGS, WORDS AND CHARS
export async function addMagickWord(data){
  const negative = data.lora_neg || ""
  await sql`
    INSERT INTO settings.magickwords (base, prompt_query, lora, lora_neg)
    VALUES (${data.base}, ${data.prompt_query}, ${data.lora}, ${negative})
  `;
}

export async function addMagickTag(data){
  await sql`
    INSERT INTO settings.magicktags (base, lora)
    VALUES (${data.base}, ${data.lora})
  `;
}

export async function addMagickChar(data){
  const extra = data.extra || ""
  await sql`
    INSERT INTO settings.magickchars (name,prompt_query,extra,lora)
    VALUES (${data.name},${data.prompt_query}, ${extra}, ${data.lora})
  `;
}

export async function addMagickCharExtra(data){
  await sql`
    INSERT INTO settings.magickchars_extra (char, costume, prompt)
    VALUES (${data.char}, ${data.costume}, ${data.prompt})
  `;
}

export async function getAllMagickWords() {
  const rows = await sql`
      SELECT * FROM settings.magickwords
  `;
  return rows;
}

export async function getAllMagickTags() {
  const rows = await sql`
      SELECT * FROM settings.magicktags
  `;
  return rows;
}

export async function getAllMagickChars() {
  const rows = await sql`
      SELECT * FROM settings.magickchars
  `;
  return rows;
}

// Strenght

export async function getAllStrenghtSettings() {
  const rows = await sql`
      SELECT * FROM settings.strenghtSetting
  `;
  return rows;
}

export async function getStrenghtByName(name) {
  const [row] = await sql`
      SELECT * FROM settings.strenghtSetting WHERE name = ${name}
  `;
  return row;
}

export async function getStrenghtById(id) {
  const [row] = await sql`
      SELECT * FROM settings.strenghtSetting WHERE id = ${id}
  `;
  return row;
}

export async function addStrenghtSetting(data) {
  await sql`
    INSERT INTO settings.strenghtSetting (name,strenght,img_link,description)
    VALUES (${data.name}, ${data.strength}, ${data.img_link}, ${data.description})
`;

  console.log("New Strenght Setting Created:", data.name);
}

// Embedings funcs
export async function addNegativeEmbedding(name) {
  await sql`
      INSERT INTO settings.negativeEmb (name)
      VALUES (${name})
  `;
}

export async function getAllModels() {
  const rows = await sql`
      SELECT * FROM settings.models
  `;

  return rows;
}

export async function createModel(data) {
  // Определяем дополнительные поля только если has_alter_mode === true
  const model_name = data.model_name;
  const description = data.description;
  const img_link = data.img_link;
  const confirm_cymbol = data.confirm_cymbol || "✅";
  const stable_model = data.stable_model;
  const is_xl_model = data.is_xl_model || false;
  const has_alter_mode = data.has_alter_mode || false;
  const enable_alter_model = data.enable_alter_model || false;
  const has_preset = data.has_preset || false;
  const alter_model_name = data.alter_model_name || "";
  const alter_model_link = data.alter_model_link || "";
  const alter_model_confirm_cymbol = data.alter_model_confirm_cymbol || "";
  const alter_model_stable_model = data.alter_model_stable_model || "";

  await sql`INSERT INTO settings.models (model_name, description, img_link, confirm_cymbol, stable_model, is_xl_model, has_alter_mode, enable_alter_model, has_preset, alter_model_name, alter_model_link, alter_model_confirm_cymbol, alter_model_stable_model) 
  VALUES (${model_name}, ${description}, ${img_link}, ${confirm_cymbol}, ${stable_model}, ${is_xl_model}, ${has_alter_mode}, ${enable_alter_model}, ${has_preset}, ${alter_model_name}, ${alter_model_link}, ${alter_model_confirm_cymbol}, ${alter_model_stable_model})
`;
}

// model_name TEXT REFERENCES models(model_name),
// preset_name text,
// description text,
// img_link text,
// confirm_cymbol TEXT DEFAULT '✅',
// style_name text,
// is_default boolean default false ,
// is_selected boolean default false ,
// UNIQUE(model_name,preset_name));

export async function createPreset(data) {
  const model_name = data.model_name;
  const preset_name = data.preset_name;
  const description = data.description;
  const img_link = data.img_link;
  const confirm_cymbol = data.confirm_cymbol || "✅";
  const style_name = data.style_name || "";
  const is_default = data.is_default || false;
  const is_selected = data.is_selected || false;

  await sql`INSERT INTO settings.presets (model_name, preset_name, description, img_link, confirm_cymbol, style_name, is_default, is_selected)
  VALUES (${model_name}, ${preset_name}, ${description}, ${img_link}, ${confirm_cymbol}, ${style_name}, ${is_default}, ${is_selected})`;
  // await sql
  console.log("New preset created:", data.preset_name, "For model", data.model_name);
}

export async function getFirstModel() {
  const row = await sql`
      SELECT * FROM settings.models LIMIT 1
  `;

  console.log(row);
  return row[0] || null;
}

export async function getModelByName(model_name) {
  if (model_name == null) {
    const [row] = await sql`
        SELECT * FROM settings.models LIMIT 1
    `;
    return row;
  }
  const [row] = await sql`
      SELECT * FROM settings.models WHERE model_name=${model_name}
  `;

  console.log(row);

  return row;
}

export async function getModelPositonByName(model_name) {
  const allModels = await sql`SELECT * FROM settings.models`;
  const position = allModels.findIndex((model) => model.model_name === model_name);
  return position;
}

export async function setAlterMode(unic_id, enable) {
  console.log(unic_id, enable, "ГОТОВЫ!!")
  await sql`
      UPDATE prompt.createdprompts SET enable_alter_model = ${enable} WHERE unic_id = ${unic_id}
  `;
}

export async function getAllPresets() {
  const presets = await sql`SELECT * FROM settings.presets`;
  return presets;
}

export async function getAllModelsPreset(model_name) {
  const presets = await sql`
      SELECT * FROM settings.presets WHERE model_name = ${model_name}
  `;
  return presets;
}

export async function getPresetByName(preset_name) {
  const [preset] = await sql`
      SELECT * FROM settings.presets WHERE preset_name=${preset_name}
  `;
  return preset;
}

export async function setPresetAsSelected(preset_name) {
  await sql`UPDATE settings.presets SET is_selected = false WHERE is_selected = true`;
  await sql`UPDATE settings.presets SET is_selected = true WHERE preset_name = ${preset_name}`;
}

export async function getDefaultPresetBymodel_name(model_name) {
  const [preset] = await sql`
      SELECT * FROM settings.presets WHERE model_name=${model_name} AND is_default=true
  `;
  return preset;
}

export async function getSelectedPresetBymodel_name(model_name) {
  const [preset] = await sql`
      SELECT * FROM settings.presets WHERE model_name=${model_name} AND is_selected=true
  `;
  return preset;
}

export async function createARExample(data) {
  await sql`
      INSERT INTO settings.aspectRatio (ratio,type,img_link,resolution) VALUES (${data.ratio},${data.type},${data.img_link},${data.resolution})
  `;
}

export async function getARByType(type) {
  const ratios = await sql`
      SELECT * FROM settings.aspectRatio WHERE type=${type}
  `;
  return ratios;
}

export async function getResolutionFromAR(ar){
  const [resolution] = await sql`
      SELECT resolution FROM settings.aspectRatio WHERE ratio=${ar}
  `;
  return resolution; 
}

export async function getARByRatio(ratio) {
  const [ar] = await sql`
      SELECT * FROM settings.aspectRatio WHERE ratio=${ratio}
  `;

  console.log(ar)
  return ar;
}

export async function getAllNegativeEmbeddings() {
  const rows = await sql`SELECT name FROM settings.negativeEmb`;
  return rows.map((row) => row.name);
}
