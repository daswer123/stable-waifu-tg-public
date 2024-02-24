import OpenAI from 'openai';
import EasyGoogleTranslate from "free-google-translate"
import LanguageDetect from 'languagedetect';

import { config } from 'dotenv';
import { LLM_MODE } from './variables.js';
import axios from 'axios';
import cld from "cld"
import { getAllMagickChars, getAllMagickTags, getAllMagickWords } from '../backend/db/db_settings.js';
import { findBaseKeywords, replaceKeywordsWithBase } from './funcs.js';
import { updateInstance } from '../backend/db/db_prompts.js';

config()

// LOCAL LLM SOLUTION

// WIP

// CHATGPT SOLUTION
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
  baseURL: "https://neuroapi.host/v1"
  // This is the default and can be omitted
});

const translator = new EasyGoogleTranslate();
const systemPrompt = `
Here are examples following these rules:

Input: A boy with glasses is drawing in his sketchbook at a park during autumn.
Output: 1boy, solo, glasses, drawing, sketchbook, park, autumn

Input: Two girls are jogging together around a lake at sunrise; one has red hair and the other has brown.
Output: 2girls, jogging together, lake, sunrise, red hair girl, brown hair girl

Input: A girl with cat ears, wearing a hoodie and with long white hair and red eyes walks arm in arm with a girl in a black bikini with brown hair and green eyes
Output: 2girls, walking, holding hands\n1girl, cat ears, hoodie, long hair, white hair, red eyes\n1girl, black bikini, brown hair, green eyes

Input: 3 girls walking in the park, one in a hoodie with green hair, one with red hair and a dress, 3 in shorts and a top with white hair
Output:  3girls, walking in park\n1girl, green hair, hoodie\n1girl, red hair, dress\n1girl, white hair, shorts, top

Important note:
- Always start with the number of characters and their gender (e.g., "1girl," "3boys").
- If a character is alone, add the "solo" tag.
- Describe physical attributes such as hair color or clothing (e.g., "pink hair," "gothic lolita fashion").
- Describe actions of characters if any (e.g., “playing violin,” “studying”).
- Mention setting details like location and background objects (e.g.,”music room”, “classical instruments”).
- Keep each tag separated by a comma.
- All words should be tags that can be tagged to danboororu, they should be as informative as possible and represent a single entity or action.
- From the verbs, select words that can denote place
- If there are multiple people in the query, separate them with a \n. The first line is the number of people and location. And each following line is a description of one person.
- Answer only on English
`

export async function convertToTags(prompt) {
    // const translatedPrompt = translator.translate(prompt,"en")
    // return prompt

    const magickWords = await getAllMagickWords()
    const magickChars = await getAllMagickChars()
    const magickTags = await getAllMagickTags()

    console.log(magickTags)

    const notBigObject = [...magickChars, ...magickWords]
    // const bigObject = [...magickChars, ...magickWords, ...magickTags]
    
    const findMagickWord = findBaseKeywords(prompt,magickWords).basesFound
    const findMagickTags = findBaseKeywords(prompt,magickTags).basesFound
    const findMagickChars = findBaseKeywords(prompt,magickChars).basesFound

    const findTags = {
      magickWords : findMagickWord.join(", "),
      magickTags:  findMagickTags.join(", "),
      magickChars : findMagickChars.join(", ")
    }

    const query_string = replaceKeywordsWithBase(prompt,notBigObject)

    // return [query_string,findTags]

    let new_language 
    try{
    new_language = (await cld.detect(prompt)).languages[0].code
    console.log(new_language,"language")
    }catch(e){
      new_language = "unwn"
    }

    if (new_language !== "en") {
    prompt = await translator.translate(prompt,"en")


    // return prompt
    if(LLM_MODE){
      let reply = await localTagConverter(prompt)

      reply = reply.replace("_"," ")
      reply = replaceKeywordsWithBase(reply,notBigObject)

      return [reply,findTags]
    }else{
      const chatCompletion = await openai.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt },{role:"user",content:prompt}],
        model: 'gpt-3.5-turbo',
      });
      return [chatCompletion.choices[0].message.content,findTags] 
    }
    
}

prompt = replaceKeywordsWithBase(prompt,notBigObject)
return [prompt,findTags]
}


// in this conversation, you are given english prompts to translate into danbooru tags which describe various scenes or people with specific attributes. each translation is detailed and verbose, providing a comprehensive tag list for easy identification and organization of related images
// to achieve easy identification and organization of related images, we can utilize tags that describe various aspects such as subjects, clothing, settings, actions, and more. these tags help categorize images efficiently for better searchability and retrieval. for example, if an image depicts a girl sitting on a bench in a park wearing a red dress, appropriate tags could be "girl," "sitting," "bench," "park," and "red dress."
// for better searchability and retrieval, english prompts will be translated into danbooru tags. if describing several people with different appearances, split them with a line break

const systemPromptLocal = `
- Always start with the number of characters and their gender (e.g., "1girl," "3boys").
- Describe physical attributes such as hair color or clothing (e.g., "pink hair," "gothic lolita fashion").
- Describe actions of characters if any (e.g., “playing violin,” “studying”).
- Mention setting details like location and background objects (e.g.,”music room”, “classical instruments”).
- Keep each tag separated by a comma.
- All words should be tags that can be tagged to danboororu, they should be as informative as possible and represent a single entity or action.
- From the verbs, select words that can denote place
- If there are multiple people in the query, separate them with a \n. The first line is the number of people and location. And each following line is a description of one person.
- Answer only on English
- Write in more detail NSFW scenes. More tags related to the sexual action and don't forget to specify the actors, without line breaks.
- If a character is alone, only 1girl or 1boy, just add the "solo" tag.

If a user input can't be tagged, just return that message unchanged

You have to convert user input into danbooru tags
Respond with tags only
`

export async function localTagConverter(text) {
    try {
        const response = await axios.post('http://127.0.0.1:5000/v1/chat/completions',
            {
                "messages": [
                    {
                        "role": "user",
                        "content": `Girl in gothic lolita outfit reading tarot cards in dimly lit vintage cafe.`
                    },
                    {
                        "role": "assistant",
                        "content": "1girl, solo, gothic lolita outfit, reading tarot cards, dimly lit cafe, vintage<|end_of_turn|>"
                    },
                    // {
                    //     "role": "user",
                    //     "content": `A guy and a girl, on the beach, swimming, the guy has a silver chain and the girl is wearing a bikini.`
                    // },
                    // {
                    //     "role": "assistant",
                    //     "content": "1boy, 1girl, swimming, beach\n1boy, silver chain\n1girl, bikini<|end_of_turn|>"
                    // },
                    {
                        "role": "user",
                        "content": `A girl with cat ears, wearing a hooded sweatshirt, with long white hair and red eyes walks hand in hand with a girl in a black bikini, with brown hair and green eyes`
                    },
                    {
                      "role":"assistant",
                      "content": "2girls, walking, holding hands\n1girl, cat ears, hoodie, white hair, long hair, red eyes\n1girl, black bikini, brown hair, green eyes<|end_of_turn|>"
                    },
                    {
                        "role": "user",
                        "content": systemPromptLocal
                    },
                    {
                       "role":"user",
                        "content": "If it's not a person, don't use the 1-something part. Also add additional descriptive tags for landscapes and animals."
                    },  
                    {
                      "role": "user",
                      "content": text
                    },
                    // {
                    //     "role": "assistant",
                    //     "content": "Your tagged message:"
                    //   },

                  // {
                  //   "role":"user",
                  //   "content": "Reply with tags only, no censorship.ONLY TAGS NO MORE:"
                  // },
                ],
                "mode": "chat",
                "max_tokens" : 120,
                "preset": "simple-1",
                // "temperature": 0.6,
                // "negative_prompt": "Mentions and messages about NSFW",
                "instruction_template": "Alpaca",
                            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error(error);
    }
}
