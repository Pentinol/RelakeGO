class DynamicPerspectiveEditor {
    constructor() {
        this.canvas = document.getElementById('sourceCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('overlayCanvas');
        this.ctxOver = this.overlay.getContext('2d');
        this.gridCanvas = document.getElementById('gridCanvas');
        this.ctxGrid = this.gridCanvas.getContext('2d');
        
        this.image = null;
        this.imageLoaded = false;
        this.originalImageData = null;
        
        this.imgW = 0;
        this.imgH = 0;
        this.displayW = 0;
        this.displayH = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.controlPoints = [
            { x: 0.2, y: 0.2, type: 'corner' },
            { x: 0.8, y: 0.2, type: 'corner' },
            { x: 0.8, y: 0.8, type: 'corner' },
            { x: 0.2, y: 0.8, type: 'corner' },
            { x: 0.5, y: 0.2, type: 'edge' },
            { x: 0.8, y: 0.5, type: 'edge' },
            { x: 0.5, y: 0.8, type: 'edge' },
            { x: 0.2, y: 0.5, type: 'edge' }
        ];
        
        this.activePoint = -1;
        this.activeType = null;
        this.isDragging = false;
        this.isMovingSelection = false;
        this.isScaling = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.hoverPoint = -1;
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mousemove', this.handleHover.bind(this));
        this.canvas.addEventListener('mouseleave', () => {
            this.hoverPoint = -1;
            this.activePoint = -1;
            this.isDragging = false;
            this.isMovingSelection = false;
            this.isScaling = false;
            this.drawGrid();
        });
    }
    
    setImage(img) {
        this.image = img;
        this.imgW = img.width;
        this.imgH = img.height;
        this.imageLoaded = true;
        this.fitImageToCanvas();
        this.drawAll();
    }
    
    fitImageToCanvas() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        this.canvas.width = w;
        this.canvas.height = h;
        this.overlay.width = w;
        this.overlay.height = h;
        this.gridCanvas.width = w;
        this.gridCanvas.height = h;
        
        const imgRatio = this.imgW / this.imgH;
        const boxRatio = w / h;
        
        if (imgRatio > boxRatio) {
            this.displayW = w;
            this.displayH = w / imgRatio;
        } else {
            this.displayH = h;
            this.displayW = h * imgRatio;
        }
        
        this.offsetX = (w - this.displayW) / 2;
        this.offsetY = (h - this.displayH) / 2;
    }
    
    screenToNorm(x, y) {
        return {
            x: (x - this.offsetX) / this.displayW,
            y: (y - this.offsetY) / this.displayH
        };
    }
    
    normToScreen(p) {
        return {
            x: this.offsetX + p.x * this.displayW,
            y: this.offsetY + p.y * this.displayH
        };
    }
    
    getCornerPoints() {
        return this.controlPoints.slice(0, 4);
    }
    
    updateEdgesFromCorners() {
        const corners = this.getCornerPoints();
        this.controlPoints[4] = { x: (corners[0].x + corners[1].x) / 2, y: (corners[0].y + corners[1].y) / 2, type: 'edge' };
        this.controlPoints[5] = { x: (corners[1].x + corners[2].x) / 2, y: (corners[1].y + corners[2].y) / 2, type: 'edge' };
        this.controlPoints[6] = { x: (corners[2].x + corners[3].x) / 2, y: (corners[2].y + corners[3].y) / 2, type: 'edge' };
        this.controlPoints[7] = { x: (corners[3].x + corners[0].x) / 2, y: (corners[3].y + corners[0].y) / 2, type: 'edge' };
    }
    
    drawAll() {
        this.drawImage();
        this.drawGrid();
        this.drawOverlay();
    }
    
    drawImage() {
        if (!this.image) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.image, this.offsetX, this.offsetY, this.displayW, this.displayH);
    }
    
    drawOverlay() {
        this.ctxOver.clearRect(0, 0, this.overlay.width, this.overlay.height);
        if (!this.imageLoaded) return;
        
        this.ctxOver.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctxOver.fillRect(0, 0, this.overlay.width, this.overlay.height);
        
        this.ctxOver.globalCompositeOperation = 'destination-out';
        this.ctxOver.beginPath();
        const corners = this.getCornerPoints().map(p => this.normToScreen(p));
        this.ctxOver.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < 4; i++) this.ctxOver.lineTo(corners[i].x, corners[i].y);
        this.ctxOver.closePath();
        this.ctxOver.fillStyle = 'white';
        this.ctxOver.fill();
        this.ctxOver.globalCompositeOperation = 'source-over';
    }
    
    drawGrid() {
        this.ctxGrid.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
        if (!this.imageLoaded) return;
        
        const corners = this.getCornerPoints().map(p => this.normToScreen(p));
        
        this.ctxGrid.strokeStyle = '#7aaec4';
        this.ctxGrid.lineWidth = 2;
        this.ctxGrid.setLineDash([6, 4]);
        
        for (let i = 1; i <= 3; i++) {
            const t = i / 4;
            
            const left = { x: corners[0].x + (corners[3].x - corners[0].x) * t, y: corners[0].y + (corners[3].y - corners[0].y) * t };
            const right = { x: corners[1].x + (corners[2].x - corners[1].x) * t, y: corners[1].y + (corners[2].y - corners[1].y) * t };
            
            this.ctxGrid.beginPath();
            this.ctxGrid.moveTo(left.x, left.y);
            this.ctxGrid.lineTo(right.x, right.y);
            this.ctxGrid.stroke();
            
            const top = { x: corners[0].x + (corners[1].x - corners[0].x) * t, y: corners[0].y + (corners[1].y - corners[0].y) * t };
            const bottom = { x: corners[3].x + (corners[2].x - corners[3].x) * t, y: corners[3].y + (corners[2].y - corners[3].y) * t };
            
            this.ctxGrid.beginPath();
            this.ctxGrid.moveTo(top.x, top.y);
            this.ctxGrid.lineTo(bottom.x, bottom.y);
            this.ctxGrid.stroke();
        }
        
        this.ctxGrid.setLineDash([]);
        this.ctxGrid.strokeStyle = '#ffb74d';
        this.ctxGrid.lineWidth = 3;
        this.ctxGrid.beginPath();
        this.ctxGrid.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < 4; i++) this.ctxGrid.lineTo(corners[i].x, corners[i].y);
        this.ctxGrid.closePath();
        this.ctxGrid.stroke();
        
        this.controlPoints.forEach((point, idx) => {
            const screen = this.normToScreen(point);
            let size = point.type === 'corner' ? 12 : 9;
            let color = idx === this.activePoint || idx === this.hoverPoint ? '#ff9800' : '#ffffff';
            
            this.ctxGrid.fillStyle = color;
            this.ctxGrid.shadowColor = '#000';
            this.ctxGrid.shadowBlur = 8;
            this.ctxGrid.beginPath();
            
            if (point.type === 'corner') {
                this.ctxGrid.arc(screen.x, screen.y, size, 0, 2 * Math.PI);
            } else {
                this.ctxGrid.moveTo(screen.x, screen.y - size);
                this.ctxGrid.lineTo(screen.x + size, screen.y);
                this.ctxGrid.lineTo(screen.x, screen.y + size);
                this.ctxGrid.lineTo(screen.x - size, screen.y);
                this.ctxGrid.closePath();
            }
            
            this.ctxGrid.fill();
            this.ctxGrid.shadowBlur = 0;
            this.ctxGrid.strokeStyle = '#333';
            this.ctxGrid.lineWidth = 2;
            this.ctxGrid.stroke();
        });
    }
    
    handleHover(e) {
        if (!this.imageLoaded) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        let found = -1;
        const screenPoints = this.controlPoints.map(p => this.normToScreen(p));
        
        for (let i = 0; i < screenPoints.length; i++) {
            const dx = mouseX - screenPoints[i].x;
            const dy = mouseY - screenPoints[i].y;
            const threshold = this.controlPoints[i].type === 'corner' ? 120 : 90;
            if (dx * dx + dy * dy < threshold) {
                found = i;
                break;
            }
        }
        
        if (found !== this.hoverPoint) {
            this.hoverPoint = found;
            this.drawGrid();
        }
    }
    
    handleMouseDown(e) {
        if (!this.imageLoaded) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        const screenPoints = this.controlPoints.map(p => this.normToScreen(p));
        for (let i = 0; i < screenPoints.length; i++) {
            const dx = mouseX - screenPoints[i].x;
            const dy = mouseY - screenPoints[i].y;
            const threshold = this.controlPoints[i].type === 'corner' ? 150 : 100;
            if (dx * dx + dy * dy < threshold) {
                this.activePoint = i;
                this.activeType = this.controlPoints[i].type;
                this.isDragging = true;
                e.preventDefault();
                return;
            }
        }
        
        const corners = this.getCornerPoints().map(p => this.normToScreen(p));
        if (this.pointInPolygon(mouseX, mouseY, corners)) {
            this.isMovingSelection = true;
            const center = this.getCenter();
            const screenCenter = this.normToScreen(center);
            this.dragOffsetX = mouseX - screenCenter.x;
            this.dragOffsetY = mouseY - screenCenter.y;
            e.preventDefault();
        } else if (this.pointNearEdge(mouseX, mouseY, corners)) {
            this.isScaling = true;
            e.preventDefault();
        }
    }
    
    handleMouseMove(e) {
        if (!this.imageLoaded) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        if (this.isDragging && this.activePoint >= 0) {
            let norm = this.screenToNorm(mouseX, mouseY);
            norm.x = Math.max(0.01, Math.min(0.99, norm.x));
            norm.y = Math.max(0.01, Math.min(0.99, norm.y));
            
            if (this.activeType === 'corner') {
                this.controlPoints[this.activePoint] = { ...norm, type: 'corner' };
                this.updateEdgesFromCorners();
            } else {
                this.controlPoints[this.activePoint] = { ...norm, type: 'edge' };
                this.updateCornersFromEdge(this.activePoint);
            }
            this.drawAll();
        } else if (this.isMovingSelection) {
            const center = this.getCenter();
            const newCenter = this.screenToNorm(mouseX - this.dragOffsetX, mouseY - this.dragOffsetY);
            const dx = newCenter.x - center.x;
            const dy = newCenter.y - center.y;
            
            let validMove = true;
            const newCorners = this.getCornerPoints().map(p => ({ x: p.x + dx, y: p.y + dy }));
            
            for (let p of newCorners) {
                if (p.x < 0.01 || p.x > 0.99 || p.y < 0.01 || p.y > 0.99) {
                    validMove = false;
                    break;
                }
            }
            
            if (validMove) {
                for (let i = 0; i < 4; i++) {
                    this.controlPoints[i].x += dx;
                    this.controlPoints[i].y += dy;
                }
                this.updateEdgesFromCorners();
                this.drawAll();
            }
        } else if (this.isScaling) {
            const center = this.getCenter();
            const mouseNorm = this.screenToNorm(mouseX, mouseY);
            const dx = mouseNorm.x - center.x;
            const dy = mouseNorm.y - center.y;
            const scale = Math.max(0.3, Math.min(2.0, Math.sqrt(dx*dx + dy*dy) * 1.5));
            
            const newCorners = this.getCornerPoints().map(p => ({
                x: Math.max(0.01, Math.min(0.99, center.x + (p.x - center.x) * scale)),
                y: Math.max(0.01, Math.min(0.99, center.y + (p.y - center.y) * scale))
            }));
            
            let valid = true;
            for (let p of newCorners) {
                if (p.x < 0.01 || p.x > 0.99 || p.y < 0.01 || p.y > 0.99) {
                    valid = false;
                    break;
                }
            }
            
            if (valid) {
                for (let i = 0; i < 4; i++) {
                    this.controlPoints[i] = { ...newCorners[i], type: 'corner' };
                }
                this.updateEdgesFromCorners();
                this.drawAll();
            }
        }
    }
    
    updateCornersFromEdge(edgeIndex) {
        const edge = this.controlPoints[edgeIndex];
        const corners = this.getCornerPoints();
        
        switch(edgeIndex) {
            case 4: corners[0].y = edge.y; corners[1].y = edge.y; break;
            case 5: corners[1].x = edge.x; corners[2].x = edge.x; break;
            case 6: corners[2].y = edge.y; corners[3].y = edge.y; break;
            case 7: corners[0].x = edge.x; corners[3].x = edge.x; break;
        }
        
        for (let i = 0; i < 4; i++) this.controlPoints[i] = corners[i];
        this.updateEdgesFromCorners();
    }
    
    handleMouseUp() {
        this.activePoint = -1;
        this.activeType = null;
        this.isDragging = false;
        this.isMovingSelection = false;
        this.isScaling = false;
        this.drawGrid();
    }
    
    getCenter() {
        const corners = this.getCornerPoints();
        return {
            x: (corners[0].x + corners[1].x + corners[2].x + corners[3].x) / 4,
            y: (corners[0].y + corners[1].y + corners[2].y + corners[3].y) / 4
        };
    }
    
    pointInPolygon(x, y, points) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x, yi = points[i].y;
            const xj = points[j].x, yj = points[j].y;
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
        }
        return inside;
    }
    
    pointNearEdge(x, y, points) {
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            if (this.distanceToLine(x, y, points[i], points[j]) < 20) return true;
        }
        return false;
    }
    
    distanceToLine(x, y, p1, p2) {
        const A = x - p1.x;
        const B = y - p1.y;
        const C = p2.x - p1.x;
        const D = p2.y - p1.y;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = lenSq !== 0 ? dot / lenSq : -1;
        
        let xx, yy;
        if (param < 0) { xx = p1.x; yy = p1.y; }
        else if (param > 1) { xx = p2.x; yy = p2.y; }
        else { xx = p1.x + param * C; yy = p1.y + param * D; }
        
        return Math.hypot(x - xx, y - yy);
    }
    
    resetPoints() {
        this.controlPoints = [
            { x: 0.2, y: 0.2, type: 'corner' },
            { x: 0.8, y: 0.2, type: 'corner' },
            { x: 0.8, y: 0.8, type: 'corner' },
            { x: 0.2, y: 0.8, type: 'corner' },
            { x: 0.5, y: 0.2, type: 'edge' },
            { x: 0.8, y: 0.5, type: 'edge' },
            { x: 0.5, y: 0.8, type: 'edge' },
            { x: 0.2, y: 0.5, type: 'edge' }
        ];
        this.drawAll();
    }
    
    getPointsForExtraction() {
        return this.getCornerPoints().map(p => ({
            x: p.x * this.imgW,
            y: p.y * this.imgH
        }));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const editor = new DynamicPerspectiveEditor();
    const fileInput = document.getElementById('fileInput');
    const loadBtn = document.getElementById('loadBtn');
    const placeholderMsg = document.getElementById('placeholderMsg');
    const resetBtn = document.getElementById('resetPointsBtn');
    const extractBtn = document.getElementById('extractBtn');
    const generateMapBtn = document.getElementById('generateMapBtn');
    const resultCanvas = document.getElementById('resultCanvas');
    const previewCanvas = document.getElementById('previewCanvas');
    const ctxRes = resultCanvas.getContext('2d');
    const ctxPrev = previewCanvas.getContext('2d');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const resolutionSelect = document.getElementById('resolutionSelect');
    const filterSelect = document.getElementById('filterSelect');
    const mapTypeSelect = document.getElementById('mapTypeSelect');
    const intensitySlider = document.getElementById('intensitySlider');
    const detailSlider = document.getElementById('detailSlider');
    const invertMap = document.getElementById('invertMap');
    const contrast = document.getElementById('contrast');
    const brightness = document.getElementById('brightness');
    const intensityValue = document.getElementById('intensityValue');
    const detailValue = document.getElementById('detailValue');
    const contrastValue = document.getElementById('contrastValue');
    const brightnessValue = document.getElementById('brightnessValue');
    const exportPng = document.getElementById('exportPng');
    const exportJpg = document.getElementById('exportJpg');
    const exportWebp = document.getElementById('exportWebp');
    
    let currentImage = null;
    let currentTextureData = null;
    let originalTextureData = null; // Для хранения оригинальных данных
    let currentRes = 1024;
    
    // Обновление значений слайдеров
    intensitySlider.addEventListener('input', () => {
        intensityValue.textContent = intensitySlider.value;
    });
    
    detailSlider.addEventListener('input', () => {
        detailValue.textContent = detailSlider.value;
    });
    
    contrast.addEventListener('input', () => {
        contrastValue.textContent = contrast.value;
    });
    
    brightness.addEventListener('input', () => {
        brightnessValue.textContent = brightness.value;
    });
    
    // Активация кнопки генерации при выборе типа карты
    mapTypeSelect.addEventListener('change', () => {
        if (mapTypeSelect.value !== 'none' && currentTextureData) {
            generateMapBtn.disabled = false;
        } else {
            generateMapBtn.disabled = true;
        }
    });
    
    loadBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                currentImage = img;
                editor.setImage(img);
                placeholderMsg.style.display = 'none';
                resetBtn.disabled = false;
                extractBtn.disabled = false;
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });
    
    const imageArea = document.getElementById('imageArea');
    imageArea.addEventListener('dragover', (e) => e.preventDefault());
    imageArea.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    currentImage = img;
                    editor.setImage(img);
                    placeholderMsg.style.display = 'none';
                    resetBtn.disabled = false;
                    extractBtn.disabled = false;
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    resetBtn.addEventListener('click', () => {
        editor.resetPoints();
    });
    
    extractBtn.addEventListener('click', () => {
        if (!currentImage) return;
        
        loadingOverlay.classList.add('show');
        
        setTimeout(() => {
            currentRes = parseInt(resolutionSelect.value);
            resultCanvas.width = currentRes;
            resultCanvas.height = currentRes;
            previewCanvas.width = 256;
            previewCanvas.height = 256;
            
            const points = editor.getPointsForExtraction();
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = currentImage.width;
            tempCanvas.height = currentImage.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(currentImage, 0, 0);
            
            const imgData = tempCtx.getImageData(0, 0, currentImage.width, currentImage.height);
            const targetData = ctxRes.createImageData(currentRes, currentRes);
            
            for (let y = 0; y < currentRes; y++) {
                for (let x = 0; x < currentRes; x++) {
                    const u = x / (currentRes - 1);
                    const v = y / (currentRes - 1);
                    
                    const sx = (1 - u) * (1 - v) * points[0].x + 
                               u * (1 - v) * points[1].x + 
                               u * v * points[2].x + 
                               (1 - u) * v * points[3].x;
                    
                    const sy = (1 - u) * (1 - v) * points[0].y + 
                               u * (1 - v) * points[1].y + 
                               u * v * points[2].y + 
                               (1 - u) * v * points[3].y;
                    
                    const ix = Math.floor(sx);
                    const iy = Math.floor(sy);
                    
                    if (ix >= 0 && ix < currentImage.width - 1 && iy >= 0 && iy < currentImage.height - 1) {
                        const dx = sx - ix;
                        const dy = sy - iy;
                        
                        const idx00 = (iy * currentImage.width + ix) * 4;
                        const idx10 = (iy * currentImage.width + (ix + 1)) * 4;
                        const idx01 = ((iy + 1) * currentImage.width + ix) * 4;
                        const idx11 = ((iy + 1) * currentImage.width + (ix + 1)) * 4;
                        
                        for (let c = 0; c < 4; c++) {
                            const c00 = imgData.data[idx00 + c];
                            const c10 = imgData.data[idx10 + c];
                            const c01 = imgData.data[idx01 + c];
                            const c11 = imgData.data[idx11 + c];
                            
                            const c0 = c00 * (1 - dx) + c10 * dx;
                            const c1 = c01 * (1 - dx) + c11 * dx;
                            const val = c0 * (1 - dy) + c1 * dy;
                            
                            targetData.data[(y * currentRes + x) * 4 + c] = val;
                        }
                    }
                }
            }
            
            ctxRes.putImageData(targetData, 0, 0);
            currentTextureData = targetData;
            originalTextureData = new ImageData(
                new Uint8ClampedArray(targetData.data),
                targetData.width,
                targetData.height
            ); // Сохраняем копию оригинальных данных
            
            filterSelect.value = 'none'; // Сбрасываем фильтр на "Без фильтра"
            updatePreview();
            
            loadingOverlay.classList.remove('show');
        }, 400);
    });
    
    filterSelect.addEventListener('change', () => {
        if (!currentTextureData || !originalTextureData) return;
        
        const filter = filterSelect.value;
        
        currentTextureData.data.set(originalTextureData.data);
        
        if (filter !== 'none') {
            const data = currentTextureData.data;
            
            switch(filter) {
                case 'grayscale':
                    for (let i = 0; i < data.length; i += 4) {
                        const avg = (data[i] + data[i+1] + data[i+2]) / 3;
                        data[i] = data[i+1] = data[i+2] = avg;
                    }
                    break;
                case 'sepia':
                    for (let i = 0; i < data.length; i += 4) {
                        let r = data[i], g = data[i+1], b = data[i+2];
                        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
                        data[i+1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
                        data[i+2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
                    }
                    break;
                case 'invert':
                    for (let i = 0; i < data.length; i += 4) {
                        data[i] = 255 - data[i];
                        data[i+1] = 255 - data[i+1];
                        data[i+2] = 255 - data[i+2];
                    }
                    break;
            }
        }
        
        ctxRes.putImageData(currentTextureData, 0, 0);
        updatePreview();
    });
    
    function updatePreview() {
        ctxPrev.drawImage(resultCanvas, 0, 0, 256, 256);
    }
    
    generateMapBtn.addEventListener('click', () => {
        if (!currentTextureData) {
            alert('Сначала преобразуйте изображение в текстуру');
            return;
        }
        
        loadingOverlay.classList.add('show');
        
        setTimeout(() => {
            const mapType = mapTypeSelect.value;
            if (mapType === 'none') {
                loadingOverlay.classList.remove('show');
                return;
            }
            
            const intensity = parseFloat(intensitySlider.value);
            const detail = parseFloat(detailSlider.value);
            const invert = invertMap.checked;
            const cont = parseFloat(contrast.value);
            const bright = parseFloat(brightness.value);
            
            // Восстанавливаем оригинальные данные перед генерацией
            if (originalTextureData) {
                currentTextureData.data.set(originalTextureData.data);
            }
            
            const data = currentTextureData.data;
            const mapData = ctxRes.createImageData(currentRes, currentRes);
            const mapArray = mapData.data;
            
            for (let y = 0; y < currentRes; y++) {
                for (let x = 0; x < currentRes; x++) {
                    const idx = (y * currentRes + x) * 4;
                    const gray = (data[idx] + data[idx+1] + data[idx+2]) / 3;
                    
                    switch(mapType) {
                        case 'normal':
                            if (x > 0 && x < currentRes - 1 && y > 0 && y < currentRes - 1) {
                                const tl = data[((y-1)*currentRes + (x-1))*4];
                                const t = data[((y-1)*currentRes + x)*4];
                                const tr = data[((y-1)*currentRes + (x+1))*4];
                                const l = data[(y*currentRes + (x-1))*4];
                                const r = data[(y*currentRes + (x+1))*4];
                                const bl = data[((y+1)*currentRes + (x-1))*4];
                                const b = data[((y+1)*currentRes + x)*4];
                                const br = data[((y+1)*currentRes + (x+1))*4];
                                
                                const dx = (tr + 2*r + br) - (tl + 2*l + bl);
                                const dy = (bl + 2*b + br) - (tl + 2*t + tr);
                                
                                const nx = dx * intensity / 255.0;
                                const ny = dy * intensity / 255.0;
                                const nz = 1.0 / Math.max(0.1, detail);
                                
                                const len = Math.hypot(nx, ny, nz);
                                
                                mapArray[idx] = ((nx/len * 0.5 + 0.5) * 255);
                                mapArray[idx+1] = ((ny/len * 0.5 + 0.5) * 255);
                                mapArray[idx+2] = ((nz/len) * 255);
                                mapArray[idx+3] = 255;
                            } else {
                                mapArray[idx] = 128;
                                mapArray[idx+1] = 128;
                                mapArray[idx+2] = 255;
                                mapArray[idx+3] = 255;
                            }
                            break;
                            
                        case 'roughness':
                            let roughVal = gray * intensity;
                            if (invert) roughVal = 255 - roughVal;
                            roughVal = Math.max(0, Math.min(255, roughVal));
                            mapArray[idx] = mapArray[idx+1] = mapArray[idx+2] = roughVal;
                            mapArray[idx+3] = 255;
                            break;
                            
                        case 'metallic':
                            let metalVal = gray * intensity * 1.2;
                            if (invert) metalVal = 255 - metalVal;
                            metalVal = Math.max(0, Math.min(255, metalVal));
                            mapArray[idx] = mapArray[idx+1] = mapArray[idx+2] = metalVal;
                            mapArray[idx+3] = 255;
                            break;
                            
                        case 'ao':
                            let aoVal = gray * 0.7 * intensity;
                            if (invert) aoVal = 255 - aoVal;
                            aoVal = Math.max(0, Math.min(255, aoVal));
                            mapArray[idx] = mapArray[idx+1] = mapArray[idx+2] = aoVal;
                            mapArray[idx+3] = 255;
                            break;
                            
                        case 'height':
                            let heightVal = gray * intensity;
                            if (invert) heightVal = 255 - heightVal;
                            heightVal = Math.max(0, Math.min(255, heightVal));
                            mapArray[idx] = mapArray[idx+1] = mapArray[idx+2] = heightVal;
                            mapArray[idx+3] = 255;
                            break;
                    }
                    
                    // Применяем контраст и яркость
                    if (mapType !== 'normal') {
                        for (let c = 0; c < 3; c++) {
                            let val = mapArray[idx + c];
                            val = ((val / 255 - 0.5) * cont + 0.5) * 255;
                            val = val * bright;
                            mapArray[idx + c] = Math.max(0, Math.min(255, val));
                        }
                    }
                }
            }
            
            ctxRes.putImageData(mapData, 0, 0);
            currentTextureData = mapData;
            // Не обновляем originalTextureData при генерации карт
            updatePreview();
            
            loadingOverlay.classList.remove('show');
        }, 300);
    });
    
    // Экспорт
    function exportAs(type) {
        if (!currentTextureData) {
            alert('Сначала создайте текстуру');
            return;
        }
        
        const mime = `image/${type === 'jpg' ? 'jpeg' : type}`;
        
        // Создаем новый canvas с правильным разрешением
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = currentRes;
        exportCanvas.height = currentRes;
        const exportCtx = exportCanvas.getContext('2d');
        exportCtx.putImageData(currentTextureData, 0, 0);
        
        exportCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `texture_${currentRes}.${type}`;
            a.click();
            URL.revokeObjectURL(url);
        }, mime, type === 'jpg' ? 0.95 : 1);
    }
    
    exportPng.addEventListener('click', () => exportAs('png'));
    exportJpg.addEventListener('click', () => exportAs('jpg'));
    exportWebp.addEventListener('click', () => exportAs('webp'));
    
    window.addEventListener('resize', () => {
        if (currentImage) {
            editor.fitImageToCanvas();
            editor.drawAll();
        }
    });
});
