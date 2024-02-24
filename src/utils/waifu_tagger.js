import axios from "axios"
import fs from 'fs';
import FormData from 'form-data';

export async function img2Tags(imgPath){
    let formData = new FormData();
    formData.append('file', fs.createReadStream(imgPath), {
        filename: imgPath,
        contentType: 'image/jpeg',
    });

    const result = await axios({
        method: 'post',
        url: 'http://localhost:8019/tag-image/',
        data: formData,
        headers: { ...formData.getHeaders() },
      });

    if(result.status === 200){
      return result.data;
    } else {
      throw new Error('Unable to process image');
   }
}
