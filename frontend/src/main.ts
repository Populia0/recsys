// Типы ответа от бэкенда
interface RecommendationItem {
    prefer: string[];
    avoid: string[];
}

interface Recommendation {
    [key: string]: RecommendationItem;
} 

interface ColorInfo {
    rgb: number[];
    hex: string;
    name: string;
    hex_ref: string;
    delta_e: number;
    recommendations: Recommendation | null;
}

interface ApiResponse {
    colors: ColorInfo[];
}

// DOM элементы
const uploadScreen = document.getElementById('uploadScreen') as HTMLElement;
const resultScreen = document.getElementById('resultScreen') as HTMLElement;
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const previewDiv = document.getElementById('preview') as HTMLElement;
const analyzeBtn = document.getElementById('analyzeBtn') as HTMLButtonElement;
const errorMsg = document.getElementById('errorMsg') as HTMLElement;
const resultImg = document.getElementById('resultImg') as HTMLImageElement;
const colorPaletteDiv = document.getElementById('colorPalette') as HTMLElement;
const recommendationsDiv = document.getElementById('recommendations') as HTMLElement;
const backBtn = document.getElementById('backBtn') as HTMLButtonElement;

let currentFile: File | null = null;
let currentColors: ColorInfo[] = [];
let activeIndex = 0;

function displayPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
        previewDiv.innerHTML = `<img src="${e.target?.result}" alt="preview">`;
    };
    reader.readAsDataURL(file);
}

function setError(msg: string): void {
    errorMsg.textContent = msg;
    setTimeout(() => errorMsg.textContent = '', 3000);
}

async function analyzeImage(file: File): Promise<ColorInfo[] | null> {
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await fetch('http://localhost:8000/analyze', {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || 'Ошибка сервера');
        }
        const data: ApiResponse = await response.json();
        return data.colors;
    } catch (err: any) {
        setError(`Ошибка: ${err.message}`);
        return null;
    }
}

function formatRecommendations(rec: Recommendation | null): string {
    if (!rec) return '<p>Нет рекомендаций для этого цвета</p>';
    
    const parts: string[] = [];
    
    const attributeLabels: { [key: string]: string } = {
        'gender': 'Пол',
        'age': 'Возраст',
        'city_size': 'Город',
        'marital_status': 'Семейное положение',
        'employment': 'Занятость',
        'country': 'Страна / регион',
        'interests': 'Интересы',
        'interests_news': 'Новостные интересы',
        'interests_leisure': 'Интересы по досугу',
        'music': 'Музыкальные вкусы'
    };
    
    for (const [attr, values] of Object.entries(rec)) {
        const label = attributeLabels[attr] || attr;
        const lines: string[] = [];
        
        if (values.prefer && values.prefer.length > 0) {
            lines.push(values.prefer.join(', '));
        }
        if (values.avoid && values.avoid.length > 0) {
            lines.push(`<span class="rec-exclusion">Исключения: ${values.avoid.join(', ')}</span>`);
        }
        
        if (lines.length > 0) {
            parts.push(`<div class="rec-field"><div class="rec-label">${label}</div><div class="rec-value">${lines.join('<br>')}</div></div>`);
        }
    }
    
    if (parts.length === 0) return '<p>Нет рекомендаций для этого цвета</p>';
    return parts.join('');
}

function renderPalette(colors: ColorInfo[]): void {
    colorPaletteDiv.innerHTML = '';
    colors.forEach((color, idx) => {
        const card = document.createElement('div');
        card.className = `color-card ${idx === activeIndex ? 'active' : ''}`;
        card.innerHTML = `
            <div class="color-swatch" style="background-color: ${color.hex};"></div>
            <div><strong>${color.name}</strong></div>
            <div style="font-size:12px;">${color.hex}</div>
        `;
        card.addEventListener('click', () => {
            document.querySelectorAll('.color-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            activeIndex = idx;
            const color = colors[idx];
            if (!color)
                 return;
            recommendationsDiv.innerHTML = formatRecommendations(color.recommendations);
        });
        colorPaletteDiv.appendChild(card);
    });
}

analyzeBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Анализируем...';
    const colors = await analyzeImage(currentFile);
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Анализировать';
    if (!colors) return;
    currentColors = colors;
    activeIndex = 0;
    const objectUrl = URL.createObjectURL(currentFile);
    resultImg.src = objectUrl;
    renderPalette(colors);
    const color = colors[0];
    if (!color)
        return;
    recommendationsDiv.innerHTML = formatRecommendations(color.recommendations);
    uploadScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
});

backBtn.addEventListener('click', () => {
    resultScreen.classList.add('hidden');
    uploadScreen.classList.remove('hidden');
    fileInput.value = '';
    previewDiv.innerHTML = '';
    analyzeBtn.disabled = true;
    currentFile = null;
    errorMsg.textContent = '';
    if (resultImg.src) URL.revokeObjectURL(resultImg.src);
});

fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) {
        analyzeBtn.disabled = true;
        previewDiv.innerHTML = '';
        currentFile = null;
        return;
    }
    if (!file.type.startsWith('image/')) {
        setError('Пожалуйста, выберите изображение');
        analyzeBtn.disabled = true;
        return;
    }
    currentFile = file;
    displayPreview(file);
    analyzeBtn.disabled = false;
});