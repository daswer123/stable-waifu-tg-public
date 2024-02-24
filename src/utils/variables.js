import { getFirstModel, getModelPositonByName } from "../backend/db/db_settings.js";

// Bot setting
export const sessionPathFolder = "data/img2img";
export const serverPort = 8070;
export const SD_ADRESS="http://localhost:7860"
export const LLM_MODE = true

export const refFolder = "data/reference"
export const poseFolder = "data/pose"
export const shapeFolder = "data/shape"

// Time to die
export const timeToDie = 600; // 10 minutes

// Hours before
export const timeToRestrictEdit = 6
export const modelsPerPage = 5

// BASE SETTINGS
export const INITIAL_SESSION = {
    // Tech vars
    inDatabase: false,
    isVeryfied: false,
    // Gift
    user_idSendGift : null,
    userNameSendGift: "",
    isAnonim: false,
    userNoteSendGift: "",
    // Default settings
    defaultModel : null,
    defaultType: "portrait",
    defaultAR: "1:1",
    // Technical vars
    menuId: null,
    messageToClear : null,
    currectAction : null,
};


// export async function initFirstModel(ctx){
//     if(!ctx.session.default_model){
//         const firstModel = 
//         ctx.session.defaultModel = firstModel.model_name
//     }
// }