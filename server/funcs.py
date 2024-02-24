import re


def build_lora_dict(query_set):
    lora_dict = {}
    for item in query_set:
        key = getattr(item, 'base', None) or getattr(item, 'name', None)
        if key:
            lora_dict[key.lower()] = item.lora  # Убедимся что ключ словаря в нижнем регистре
    return lora_dict

def replace_with_loras_and_weights(text, finded_items, lora_dict):
    # Подготовим шаблон для поиска: "слово/фраза:вес" или "слово/фраза", где вес может быть отрицательным
    pattern = re.compile(r'\b(?:' + '|'.join(re.escape(key) for key in finded_items) + r')\b(?::\-?\d*(?:\.\d+)?)?')

    def replacement(match):
        word_key = match.group(0).lower()  # Получаем полное соответствие (с весом или без)
        base_word = word_key.split(':')[0]  # Отделяем базовое слово от веса

        if base_word in lora_dict:
            weight_match = re.search(r':(\-?\d*\.?\d+)', word_key)
            new_weight_value = weight_match.group(1) if weight_match else None

            lora_tag_pattern = re.compile(r'<lora:[^:>]+(?::\-?\d*\.?\d+)?>')
            existing_lora_tag_match = lora_tag_pattern.search(lora_dict[base_word])

            if existing_lora_tag_match and new_weight_value:
                old_full_tag = existing_lora_tag_match.group(0)
                tag_base_name = old_full_tag.split(':')[1]
                updated_lora_tag = f"<lora:{tag_base_name}:{new_weight_value}>"
                return lora_dict[base_word].replace(old_full_tag, updated_lora_tag)
            elif new_weight_value:
                return f"({lora_dict[base_word]}:{new_weight_value})"
            else:
                return f"{lora_dict[base_word]}"

        return word_key  # Если совпадение не найдено, вернуть исходный текст

    return pattern.sub(replacement, text)


def replace_all_with_loras_and_weights(text, finded_items, lora_dict):
    # Подготовим шаблон для поиска: "слово/фраза:вес" или "слово/фраза", где вес может быть отрицательным
    pattern = re.compile(r'\b(?:' + '|'.join(re.escape(key) for key in finded_items) + r')\b(?::\-?\d*(?:\.\d+)?)?')

    def replacement(match):
        word_key = match.group(0).lower()  # Получаем полное соответствие (с весом или без)
        base_word = word_key.split(':')[0]  # Отделяем базовое слово от веса

        if base_word in lora_dict:
            weight_match = re.search(r':(\-?\d*\.?\d+)', word_key)
            weight_value = weight_match.group(1) if weight_match else None

            if weight_value:
                # Добавляем вес ко всем элементам из словарного значения
                updated_lora_values = []
                for lora_part in lora_dict[base_word].split():
                    if '<lora:' in lora_part:
                        # Если это тэг lora с существующим весом, заменяем его на новый
                        updated_lora_values.append(re.sub(r'(\<lora:[^:>]+)(:\-?\d*\.?\d+)?(\>)', r'\1:' + weight_value + r'\3', lora_part))
                    else:
                        updated_lora_values.append(f"{lora_part}:{weight_value}")

                return f"{base_word}:{weight_value} {' '.join(updated_lora_values)}"
            else:
                return f"{base_word} {lora_dict[base_word]}"

        return word_key  # Если нет соответствия в словаре, вернуть исходный текст

    return pattern.sub(replacement, text)




import requests

def check_and_swap_sd_model(model_name):
    # URL для получения текущих опций сервера
    options_url = "http://127.0.0.1:7860/sdapi/v1/options"

    try:
        # Получаем текущие опции с сервера
        response = requests.get(options_url)

        # Убедимся, что запрос прошёл успешно
        if response.status_code == 200:
            current_options = response.json()

            # Проверяем, совпадает ли загруженная модель с желаемой
            if current_options["sd_model_checkpoint"] != model_name:
                print(f"Текущая модель ({current_options['sd_model_checkpoint']}) отличается от {model_name}. Загружаем новую модель...")
                # Модели различаются, отправляем POST-запрос для изменения модели
                post_response = requests.post(options_url, json={"sd_model_checkpoint": model_name})

                if post_response.status_code == 200:
                    print("Модель успешно обновлена.")
                else:
                    print(f"Ошибка при обновлении модели: {post_response.status_code}")
            else:
                print("Текущая модель уже загружена.")
        else:
            print(f"Ошибка при получении текущих настроек: {response.status_code}")

    except requests.exceptions.RequestException as e:
        # Сетевая ошибка (например, DNS failure, refused connection и т.д.)
        print(f"Ошибка подключения к серверу: {e}")