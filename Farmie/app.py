from flask import Flask, request, jsonify, make_response
import mysql.connector
import hashlib
import os
import requests
# import numpy as np
# import tensorflow as tf
from werkzeug.utils import secure_filename
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import traceback

# --- App and JWT Setup ---
app = Flask(__name__)
app.config['SECRET_KEY'] = 'farmie_secret_key'
app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'
app.config['SESSION_COOKIE_NAME'] = 'session'
CORS(app, origins="*", supports_credentials=True)
jwt = JWTManager(app)

# --- Model and Upload Setup ---
# UPLOAD_FOLDER = 'uploads'
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# model = None  # Global model reference
# class_names = [
#     'aloevera', 'banana', 'bilimbi', 'cantaloupe', 'cassava', 'coconut', 'corn',
#     'cucumber', 'curcuma', 'eggplant', 'galangal', 'ginger', 'guava', 'kale',
#     'longbeans', 'mango', 'melon', 'orange', 'paddy', 'papaya', 'peper chili',
#     'pineapple', 'pomelo', 'shallot', 'soybeans', 'spinach', 'sweet potatoes',
#     'tobacco', 'waterapple', 'watermelon'
# ]
# img_height, img_width = 224, 224

# # --- Lazy Load Model ---
# def get_model():
#     global model
#     if model is None:
#         try:
#             model = tf.keras.models.load_model("plant_identifier_model1")
#         except Exception as e:
#             raise RuntimeError(f"Failed to load model: {e}")
#     return model

# # --- Image Prediction Logic ---
# def predict_image(image_path):
#     model = get_model()
#     img = tf.keras.utils.load_img(image_path, target_size=(img_height, img_width))
#     img_array = tf.keras.utils.img_to_array(img)
#     img_array = tf.expand_dims(img_array, 0)
#     predictions = model.predict(img_array)
#     predicted_index = np.argmax(predictions[0])
#     predicted_class = class_names[predicted_index]
#     confidence = float(predictions[0][predicted_index])
#     return predicted_class, confidence



 

# --- DB Connection & Password Hashing ---
def get_db_connection():
    return mysql.connector.connect(
        host='localhost',
        user='farmie_user',
        password='farmie123',
        database='Farmie'
    )

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


# --- Routes ---
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    user_name, email, password = data.get('user_name'), data.get('email'), data.get('password')
    if not user_name or not password or not email:
        return make_response(jsonify({'message': 'All fields are required'}), 400)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM User WHERE user_name = %s', (user_name,))
    if cursor.fetchone():
        return make_response(jsonify({'message': 'User already exists'}), 409)

    hashed_password = hash_password(password)
    cursor.execute('INSERT INTO User (user_name, email, password) VALUES (%s, %s, %s)', 
                   (user_name, email, hashed_password))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user_name, password = data.get('user_name'), data.get('password')
    if not user_name or not password:
        return make_response(jsonify({'message': 'Username and password required'}), 400)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT password FROM User WHERE user_name = %s', (user_name,))
    result = cursor.fetchone()
    if not result or hash_password(password) != result[0]:
        return make_response(jsonify({'message': 'Invalid username or password'}), 401)

    access_token = create_access_token(identity=user_name)
    cursor.close()
    conn.close()
    return jsonify({'access_token': access_token}), 200

@app.route('/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logout successful'}), 200

@app.route('/add_farm', methods=['POST'])
@jwt_required()
def add_farm():
    user_name = get_jwt_identity()
    data = request.get_json()
    farm_name, longitude, latitude = data.get('name'), data.get('longitude'), data.get('latitude')
    if not farm_name or longitude is None or latitude is None:
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT user_id FROM user WHERE user_name = %s", (user_name,))
        user = cur.fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user_id = user[0]
        cur.execute("""
            INSERT INTO farm (user_id, farm_name, longitude, latitude)
            VALUES (%s, %s, %s, %s)
        """, (user_id, farm_name, longitude, latitude))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Farm added successfully'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_farms_by_user', methods=['GET'])
@jwt_required()
def get_farms_by_user():
    user_name = get_jwt_identity()
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT user_id FROM User WHERE user_name = %s", (user_name,))
        user = cur.fetchone()
        if not user:
            return jsonify([]), 200

        user_id = user[0]
        cur.execute("""
            SELECT farm_id, farm_name, longitude, latitude
            FROM farm
            WHERE user_id = %s
        """, (user_id,))
        farms = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([{
            'id': row[0],
            'name': row[1],
            'longitude': row[2],
            'latitude': row[3],
        } for row in farms]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_crops_for_farm', methods=['GET'])
def get_crops_by_farm():
    farm_id = request.args.get('farm_id')
    if not farm_id:
        return jsonify({'error': 'Missing farm_id'}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT Crop.crop_name, Crop.crop_family, Cultivate.quantity
            FROM Crop
            JOIN Cultivate ON Crop.crop_name = Cultivate.crop_name
            WHERE Cultivate.farm_id = %s
        """, (farm_id,))
        crops = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([{
            'crop_name': row[0],
            'family': row[1],
            'quantity': row[2],
        } for row in crops]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# @app.route('/predict_crop', methods=['POST'])
# @jwt_required()
# def predict_crop():
#     if 'image' not in request.files:
#         return jsonify({'error': 'No image provided'}), 400

#     image_file = request.files['image']
#     if image_file.filename == '':
#         return jsonify({'error': 'No selected file'}), 400

#     try:
#         response = requests.post(
#             'http://localhost:5002/predict',  # model server endpoint
#             files={'image': (image_file.filename, image_file.stream, image_file.mimetype)}
#         )

#         if response.status_code != 200:
#             return jsonify({'error': 'Prediction failed from model server', 'details': response.json()}), 500

#         prediction = response.json()
#         return jsonify(prediction), 200

#     except requests.exceptions.ConnectionError:
#         return jsonify({'error': 'Model server is unavailable'}), 503
#     except Exception as e:
#         return jsonify({'error': f'Unexpected error: {str(e)}'}), 500
    

@app.route('/predict_crop', methods=['POST','GET'])
@jwt_required()
def predict_crop():
    current_user = get_jwt_identity()
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        response = requests.post(
            'http://172.20.10.2:5002/predict',  # model server endpoint
            files={'image': (image_file.filename, image_file.stream, image_file.mimetype)}
        )

        if response.status_code != 200:
            return jsonify({'error': 'Prediction failed from model server', 'details': response.json()}), 500

        prediction = response.json()
        return jsonify(prediction), 200

    except requests.exceptions.ConnectionError:
        return jsonify({'error': 'Model server is unavailable'}), 503
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


@app.route('/get_all_crops', methods=['GET'])
def get_all_crops():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = "SELECT crop_name, crop_family FROM Crop"
        cursor.execute(query)
        crops = cursor.fetchall()

        return jsonify(crops), 200
    except Exception as e:
        print("Error fetching crops:", e)
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@app.route('/add_crop_to_farm', methods=['POST'])
@jwt_required()
def add_crop_to_farm():
    # Extract user identity and request data
    user_name = get_jwt_identity()
    data = request.get_json()

    crop_name = data.get('crop_name')
    quantity = data.get('quantity')
    farm_id = data.get('farm_id')

    # Validate the input data
    if not crop_name or not quantity or not farm_id:
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        # Establish database connection
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if the user owns the farm
        cursor.execute("SELECT user_id FROM farm WHERE farm_id = %s", (farm_id,))
        farm = cursor.fetchone()
        if not farm:
            return jsonify({'error': 'Farm not found'}), 404

        cursor.execute("SELECT user_id FROM User WHERE user_name = %s", (user_name,))
        user = cursor.fetchone()
        if not user or user[0] != farm[0]:
            return jsonify({'error': 'You do not have permission to add crops to this farm'}), 403

        # Check if the crop exists in the Crop table
        cursor.execute("SELECT * FROM Crop WHERE crop_name = %s", (crop_name,))
        crop = cursor.fetchone()
        if not crop:
            return jsonify({'error': 'Crop not found in the database'}), 404

        # Add the crop to the Cultivate table (linking crop and farm)
        cursor.execute("""
            INSERT INTO Cultivate (farm_id, crop_name, quantity)
            VALUES (%s, %s, %s)
        """, (farm_id, crop_name, quantity))
        
        # Commit the transaction
        conn.commit()
        
        # Clean up and close connections
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Crop added to farm successfully'}), 201

    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
    
@app.route('/crop_family', methods=['GET'])
def get_crop_family():
    crop_name = request.args.get('crop_name')
    if not crop_name:
        return jsonify({'error': 'Missing crop_name'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT crop_family FROM Crop WHERE crop_name = %s", (crop_name,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()

        if not result:
            return jsonify({'error': 'Crop not found'}), 404

        return jsonify({'crop_family': result[0]}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

@app.route('/get_weather', methods=['GET'])
@jwt_required()
def get_weather():
    farm_id = request.args.get('farm_id')
    if not farm_id:
        return jsonify({'error': 'Missing farm_id'}), 400

    try:
        # Connect to DB to get latitude and longitude of the farm
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT latitude, longitude FROM farm WHERE farm_id = %s", (farm_id,))
        farm = cursor.fetchone()
        cursor.close()
        conn.close()

        if not farm:
            return jsonify({'error': 'Farm not found'}), 404

        latitude, longitude = farm

        # Calculate date range (last 30 days)
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)

        # Construct API URL
        weather_url = (
            f"https://archive-api.open-meteo.com/v1/archive"
            f"?latitude={latitude}&longitude={longitude}"
            f"&start_date={start_date}&end_date={end_date}"
            f"&daily=temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean"
            f"&timezone=auto"
        )

        # Request weather data
        response = requests.get(weather_url)
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch weather data'}), 500

        data = response.json()
        if "daily" not in data:
            return jsonify({'error': 'Unexpected weather API response'}), 500

        daily = data["daily"]
        count = len(daily["temperature_2m_mean"])

        # Compute averages
        avg_temp = sum(daily["temperature_2m_mean"]) / count
        avg_rainfall = sum(daily["precipitation_sum"]) / count
        avg_humidity = sum(daily["relative_humidity_2m_mean"]) / count

        return jsonify({
            "average_temperature": round(avg_temp, 2),
            "average_rainfall": round(avg_rainfall, 2),
            "average_humidity": round(avg_humidity, 2),
        }), 200

    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
    


@app.route('/crop_recommendation', methods=['GET'])
@jwt_required()
def recommend_crop():
    analyzed_crop_name = request.args.get('crop_name')
    farm_id = request.args.get('farm_id')
    print(f"Analyzed crop: {analyzed_crop_name}, Farm ID: {farm_id}")

    if not analyzed_crop_name or not farm_id:
        return jsonify({'error': 'Missing crop_name or farm_id'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # 1. Get crop_family of analyzed crop
        cursor.execute("SELECT crop_family FROM Crop WHERE crop_name = %s", (analyzed_crop_name,))
        result = cursor.fetchone()
        if not result:
            return jsonify({'error': 'Analyzed crop not found'}), 404
        analyzed_family = result['crop_family']
        print(f"Analyzed crop family: {analyzed_family}")

        # 2. Get latitude and longitude for the given farm
        cursor.execute("SELECT latitude, longitude FROM Farm WHERE farm_id = %s", (farm_id,))
        farm = cursor.fetchone()
        if not farm:
            return jsonify({'error': 'Farm not found'}), 404
        latitude, longitude = farm['latitude'], farm['longitude']
        print(f"Farm coordinates: Latitude {latitude}, Longitude {longitude}")

        # 3. Get full-year 2024 weather data
        start_date = '2024-01-01'
        end_date = '2024-12-31'
        weather_url = (
            f"https://archive-api.open-meteo.com/v1/archive"
            f"?latitude={latitude}&longitude={longitude}"
            f"&start_date={start_date}&end_date={end_date}"
            f"&daily=temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean"
            f"&timezone=auto"
        )

        response = requests.get(weather_url)
        if response.status_code != 200:
            print(f"Weather API failed with status: {response.status_code}")
            return jsonify({'error': 'Failed to fetch weather data'}), 500

        data = response.json().get('daily', {})
        print("Weather data keys received:", data.keys())

        def safe_average(lst):
            filtered = [v for v in lst if v is not None]
            return round(sum(filtered) / len(filtered), 2) if filtered else 0.0

        def safe_total(lst):
            filtered = [v for v in lst if v is not None]
            return round(sum(filtered), 2)

        avg_temp = safe_average(data.get('temperature_2m_mean', []))
        avg_humidity = safe_average(data.get('relative_humidity_2m_mean', []))
        total_rain = safe_total(data.get('precipitation_sum', []))

        print(f"Avg Temp: {avg_temp}, Avg Humidity: {avg_humidity}, Total Rain: {total_rain}")

        # 4. Get all crops
        cursor.execute("SELECT crop_name, crop_family, optimal_temp, optimal_rainfall, optimal_humidity FROM Crop")
        crops = cursor.fetchall()

        # 5. Get total quantity of each crop across all farms
        cursor.execute("""
            SELECT 
                c.crop_name,
                COALESCE(SUM(cv.quantity), 0) AS total_quantity
            FROM Crop c
            LEFT JOIN Cultivate cv ON c.crop_name = cv.crop_name
            GROUP BY c.crop_name
        """)
        quantities = cursor.fetchall()
        quantity_dict = {row['crop_name']: row['total_quantity'] for row in quantities}

        # 6. Identify most cultivated crop
        most_cultivated_crop = max(quantity_dict.items(), key=lambda x: x[1])[0] if quantity_dict else None
        print(f"Most cultivated crop: {most_cultivated_crop}")

        # 7. Scoring logic
        results = []
        for crop in crops:
            name = crop['crop_name']
            family = crop['crop_family']
            optimal_temp = float(crop['optimal_temp']) if crop['optimal_temp'] is not None else None
            optimal_rain = float(crop['optimal_rainfall']) if crop['optimal_rainfall'] is not None else None
            optimal_humidity = float(crop['optimal_humidity']) if crop['optimal_humidity'] is not None else None

            family_score = 20 if family == analyzed_family else 0
            temp_score = max(0, 30 - abs(optimal_temp - avg_temp)) if optimal_temp is not None else 0
            rain_score = max(0, 30 - abs(optimal_rain - total_rain)) if optimal_rain is not None else 0
            humidity_score = max(0, 20 - abs(optimal_humidity - avg_humidity)) if optimal_humidity is not None else 0

            total_score = family_score + temp_score + rain_score + humidity_score

            if name == most_cultivated_crop:
                total_score = 0

            results.append({
                'crop_name': name,
                'score': round(total_score, 2),
                'total_quantity': quantity_dict.get(name, 0)
            })

        
        # 8. Remove the analyzed crop from the results
        filtered_results = [crop for crop in results if crop['crop_name'] != analyzed_crop_name]

        # 9. Return top 3 recommendations excluding the analyzed crop
        top_crops = sorted(filtered_results, key=lambda x: x['score'], reverse=True)[:3]

        #top_crops = sorted(results, key=lambda x: x['score'], reverse=True)[:3]

        return jsonify({'recommendations': [c['crop_name'] for c in top_crops]}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@app.route('/update_crop_quantity', methods=['PUT'])
def update_crop_quantity():
    data = request.get_json()
    farm_id = data.get('farm_id')
    crop_name = data.get('crop_name')
    new_quantity = data.get('new_quantity')

    if not all([farm_id, crop_name, isinstance(new_quantity, int)]):
        return jsonify({'error': 'Invalid input'}), 400

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        update_query = """
            UPDATE cultivate
            SET quantity = %s
            WHERE farm_id = %s AND crop_name = %s
        """
        cursor.execute(update_query, (new_quantity, farm_id, crop_name))
        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({'error': 'No matching crop found'}), 404

        return jsonify({'message': 'Quantity updated successfully'}), 200
    except Exception as e:
        print('Error:', e)
        return jsonify({'error': 'Server error'}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/delete_crop_from_farm', methods=['DELETE'])
def delete_crop_from_farm():
    farm_id = request.args.get('farm_id')
    crop_name = request.args.get('crop_name')

    if not farm_id or not crop_name:
        return jsonify({'error': 'Missing farm_id or crop_name'}), 400

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        delete_query = """
            DELETE FROM cultivate
            WHERE farm_id = %s AND crop_name = %s
        """
        cursor.execute(delete_query, (farm_id, crop_name))
        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({'error': 'Crop not found for this farm'}), 404

        return jsonify({'message': 'Crop deleted successfully'}), 200
    except Exception as e:
        print('Error:', e)
        return jsonify({'error': 'Server error'}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/delete_farm/<int:farm_id>', methods=['DELETE'])
@jwt_required()
def delete_farm(farm_id):
    user_name = get_jwt_identity()
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Verify user owns the farm
        cursor.execute("SELECT user_id FROM farm WHERE farm_id = %s", (farm_id,))
        farm = cursor.fetchone()
        if not farm:
            return jsonify({'error': 'Farm not found'}), 404

        cursor.execute("SELECT user_id FROM User WHERE user_name = %s", (user_name,))
        user = cursor.fetchone()
        if not user or user[0] != farm[0]:
            return jsonify({'error': 'Unauthorized to delete this farm'}), 403

        # Delete related entries from Cultivate first due to FK constraints
        cursor.execute("DELETE FROM Cultivate WHERE farm_id = %s", (farm_id,))
        # Delete the farm
        cursor.execute("DELETE FROM farm WHERE farm_id = %s", (farm_id,))

        conn.commit()
        return jsonify({'message': 'Farm deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
