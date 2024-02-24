import base64
from PIL import Image
import io
import cv2


def saveImgBase64ToPng(base64_string, path):
    # Decode the base64 string
    img_data = base64.b64decode(base64_string)

    # Convert binary data to image object using Pillow
    image = Image.open(io.BytesIO(img_data))

    # Save the image to the specified path as a PNG file
    image.save(path, "PNG")


def getWidthAndHeightFromImg(path):
    img = cv2.imread(path)
    return (img.shape[1], img.shape[0])


def getImgBaseFromPng(path):
    img = cv2.imread(path)

    # Encode into PNG and send to ControlNet
    retval, bytes = cv2.imencode('.png', img)
    encoded_image = base64.b64encode(bytes).decode('utf-8')
    return encoded_image


# Функция для обработки строк
def process_mult_chars(input_text):
    # Разбиваем входной текст по переводам строк
    lines = input_text.strip().split('\n')
    
    # Если есть только одна линия и она без пробелов, возвращаем её и количество линий равно 1
    if len(lines) == 1 and '\n' not in lines[0]:
        return [lines[0], 1, "1","1"]

    # Обрабатываем строки и добавляем BREAK между ними (кроме последней)
    processed_lines = ' BREAK\n'.join(lines)

    # Создаём третий элемент: строку с числами "1", разделенными запятой,
    # кол-во "1" соответствует количеству строк
    ones_string = ",".join(["1"] * len(lines))

    # Возвращаем результат: обработанные строки, количество строк и третий элемент
    return [processed_lines, len(lines), ones_string]


positive_base = (
    "(8k uhd, masterpiece, best quality, high quality, absurdres, ultra-detailed) "
)
negative_base = "easynegative , bad-hands-5 (worst quality:1.2), mutated hands and fingers, [bad : wrong] anatomy"
