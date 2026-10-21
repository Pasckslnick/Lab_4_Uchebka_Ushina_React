const API_URL = 'http://localhost:3001/api';

// ПОЛУЧЕНИЕ
export async function getAllCars() {
    const response = await fetch(`${API_URL}/get_all_cars`);
    if (!response.ok) throw new Error('Ошибка при получении машин');
    return await response.json();
}

export async function getAllCategories() {
    const response = await fetch(`${API_URL}/get_cars_category`);
    if (!response.ok) throw new Error('Ошибка при получении категорий');
    return await response.json();
}

export async function addCar(carData) {
    const response = await fetch(`${API_URL}/add_car`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Ошибка добавления');
    return data;
}

export async function updateCar(id, carData) {
    const response = await fetch(`${API_URL}/update_car/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(carData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Ошибка обновления');
    return data;
}

// УДАЛЕНИЕ
export async function deleteCar(id) {
    const response = await fetch(`${API_URL}/delete_car/${id}`);
    if (!response.ok) throw new Error('Ошибка удаления');
    return await response.json();
}