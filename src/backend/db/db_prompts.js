import { convertToOriginalTypes, stringifiedData } from "../../utils/funcs.js";
import { timeToDie } from "../../utils/variables.js";
import {redis, sql} from "./init.js";

export async function createPromptTable() {
  await sql`
    CREATE SCHEMA IF NOT EXISTS prompt;
  `;
  console.log("Custom schema ready.");


  await sql`
      CREATE TABLE IF NOT EXISTS prompt.createdPrompts (
        unic_id TEXT PRIMARY KEY,
        edit_id TEXT default '',
        subsid_id TEXT default '',
        model_name TEXT default '',
        enable_alter_model BOOLEAN default false,
        model_page INTEGER default 0,
        preset_name TEXT default '',
        sd_model TEXT default '',
        variation_sid BIGINT default 0,
        sid BIGINT default 0,
        type TEXT default '',
        negative_mode TEXT default 'simple',
        negative_prompt TEXT default '',
        prompt TEXT default '',
        magick_ref TEXT default '',
        magick_shape TEXT default '',
        magick_pose TEXT default '',
        extra_chars TEXT default '',
        extra_char_outfit TEXT default '',
        extra_tags TEXT default '',
        extra_word TEXT default '',
        aspect_ratio text default '',
        generation_type text default '',
        img2img_path text default '',
        img_2_img_strength text default '',
        img_2_imgStrength_Value float default 0,
        img_2_raw_image text default '',
        img_2_smart_recycle boolean default false ,
        creator_id integer default 0,
        show_time_stamp integer default 0 ,
        is_generated integer default 0 ,
        created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
`;
console.log("Created Prompts table ready.");
}


// FUNCS
export async function getInstanceById(unic_id) {
  
  const result = await redis.hGetAll(unic_id);

  if(Object.keys(result).length === 0){
     const [row] = await sql`
      SELECT * FROM prompt.createdPrompts WHERE unic_id = ${unic_id}
  `;
    console.log(row);
    return row || null;
  }
  return result

 
}

export async function handleInstanceRequest(unic_id,ctx) {
  const instance = await getInstanceById(unic_id,ctx)

  if (!instance) {
    await ctx.telegram.answerCbQuery(
      ctx.callbackQuery.id,"Прошло много времени и Телеграм не позволяет нам редактировать сообщение. Попробуйте снова.",{show_alert:true}
    );
    return;
  }
  return convertToOriginalTypes(instance)
  // Здесь логика обработки instance, если он не null
}



export async function getInstanceByedit_id( edit_id){
  let [row] = await sql`
      SELECT * FROM prompt.createdPrompts WHERE edit_id = ${edit_id}
  `;
  // redis.hSet(row.unic_id,row)
  // redis.expire(row.unic_id, timeToDie)

  return row || null;
}

export async function getInstanceCreatedTimeById( unic_id){
const [row] = await sql`
    SELECT created_at FROM prompt.createdPrompts WHERE unic_id = ${unic_id}
`;
return row ? row.created_at : null;
}

export async function createInstance(data) {
   const unic_id = data.unic_id;
   const edit_id = data.edit_id;
   const subsid_id = data.subsid_id || "";
   const model_name = data.model_name;
   const model_page = data.model_page || 0;
   const preset_name = data.preset_name || "";
   const enable_alter_model = data.enable_alter_model || false;
   const sd_model = data.sd_model || "";
   const sid = data.sid || 0;
   const variation_sid = data.variation_sid || 0;
   const type = data.type || "";
   const negative_mode = data.negative_mode || "simple";
   const negative_prompt = data.negative_prompt || "";
   const prompt = data.prompt || "";
   const aspect_ratio = data.aspect_ratio || "";
   const generation_type = data.generation_type || "";
   const magick_ref = data.magick_ref || "";
   const magick_shape = data.magick_shape || "";
   const magick_pose = data.magick_pose || "";
   const img2img_path = data.img2img_path || "";
   const img_2_raw_image = data.img_2_raw_image || "";
   const img_2_img_strength = data.img_2_img_strength || "Средняя";
   const img_2_imgStrength_Value = data.img_2_imgStrength_Value || 0;
   const img_2_smart_recycle = data.img_2_smart_recycle || false;
   const creator_id = data.creator_id || 0;

   const extra_chars = data.extra_chars || ""
   const extra_tags = data.extra_tags || ""
   const extra_word = data.extra_word || ""
   const extra_char_outfit = data.extra_char_outfit || ""

  const special_data = await stringifiedData({...data})
  console.log(special_data)

  await redis.hSet(unic_id,special_data)
  await redis.hSet(edit_id,special_data)

  await redis.expire(unic_id, 6000)

  setImmediate(async() => {
    await sql`INSERT INTO prompt.createdPrompts (unic_id, edit_id,subsid_id, model_name, model_page, preset_name, sd_model,variation_sid, sid, type, negative_mode, negative_prompt, prompt, aspect_ratio, generation_type,img2img_path, img_2_img_strength, img_2_imgStrength_Value,
      img_2_smart_recycle, creator_id,img_2_raw_image, magick_ref,magick_shape, magick_pose, extra_chars, extra_tags, extra_word, extra_char_outfit,enable_alter_model ) VALUES (${unic_id}, ${edit_id},${subsid_id}, ${model_name}, ${model_page}, ${preset_name}, ${sd_model}, ${variation_sid}, ${sid}, ${type}, ${negative_mode}, ${negative_prompt}, ${prompt}, ${aspect_ratio}, ${generation_type},${img2img_path}, ${img_2_img_strength},
         ${img_2_imgStrength_Value}, ${img_2_smart_recycle}, ${creator_id},${img_2_raw_image}, ${magick_ref}, ${magick_shape}, ${magick_pose}, ${extra_chars}, ${extra_tags}, ${extra_word}, ${extra_char_outfit}, ${enable_alter_model} )`;

      console.log("Inserted in db")
  })
  

  console.log("A new instance has been inserted.", data,unic_id);
}

// Get number of all incances
export async function countInstances() {
  const [row] = await sql`
      SELECT COUNT(*) FROM prompt.createdPrompts
  `;
  return row.count; // Return the count value from the row object
}

export async function updateInstance( unic_id, fieldNameToUpdate,valueToUpdate){

  await redis.hSet(unic_id, fieldNameToUpdate, String(valueToUpdate))

  // Sync with DB
  setImmediate(async() => {
    await sql.unsafe(
      `
      UPDATE prompt.createdPrompts SET
      "${fieldNameToUpdate}" = $1 WHERE unic_id = $2
  `,
      [valueToUpdate, unic_id]
    );
  })
  console.log(`Updated row(s) where unic_id=${unic_id}.`);

}

  export async function updateInstanceSid(unic_id,sid){
    await redis.hSet(unic_id, "sid", String(sid))

    await sql.unsafe(`UPDATE prompt.createdprompts SET sid = $1 WHERE unic_id = $2 `,[sid,unic_id])
  }

  // 

  // Since we don't have changes info like SQLite's run() method:

  // await sql.unsafe(`
  //     UPDATE prompt.createdPrompts SET
  //     "${fieldNameToUpdate}" = $1 WHERE unic_id = $2
  // `, [valueToUpdate, unic_id]);

  // Since we don't have changes info like SQLite's run() method:
  
  // console.log(`Updated row(s) where unic_id=${unic_id}.`);
// }

export async function getOperationStatus(job_id){
  const status = await sql`SELECT status FROM prompt.queue WHERE job_id = ${job_id}`;

  const text = status[0].status
  console.log(text,"Статуссс")
  if(text && text == "started"){
    return false
  }

  return true
}

export async function getUnicIdByJobId(job_id){
  const data = await sql`SELECT * FROM prompt.queue WHERE job_id = ${job_id}`;
  return data[0].unic_id
}
