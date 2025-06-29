let selectedFormat = null;
let exampleImage = null;
let exampleImageLoaded = false;
let visualImages = [];

document.getElementById('exampleImage').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                exampleImage = img;
                exampleImageLoaded = true;
                checkReady();
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('visualImages').addEventListener('change', (e) => {
    visualImages = Array.from(e.target.files);
    checkReady();
});

function selectFormat(format) {
    selectedFormat = format;
    checkReady();
}

function checkReady() {
    document.getElementById('downloadBtn').disabled = !(selectedFormat && exampleImageLoaded && visualImages.length > 0);
}

document.getElementById('downloadBtn').addEventListener('click', () => {
    if (!selectedFormat || !exampleImageLoaded || visualImages.length === 0) return;

    const zip = new JSZip();
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const config = getFormatConfig(selectedFormat);

    Promise.all(visualImages.map(file => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
               
                canvas.width = config.canvasWidth;
                canvas.height = config.canvasHeight;

                // 완전 초기화
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (selectedFormat === 'mo2') {
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                // 예시 비주얼을 정확히 캔버스 크기에 맞춰서 그리기
                ctx.drawImage(exampleImage, 0, 0, canvas.width, canvas.height);

                // 비주얼 합성
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(config.visualX, config.visualY, config.visualWidth, config.visualHeight, config.borderRadius);
                ctx.clip();

                const aspectRatioVisual = config.visualWidth / config.visualHeight;
                const aspectRatioImg = img.width / img.height;

                let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

                if (aspectRatioImg > aspectRatioVisual) {
                    sWidth = img.height * aspectRatioVisual;
                    sx = (img.width - sWidth) / 2;
                } else {
                    sHeight = img.width / aspectRatioVisual;
                    sy = (img.height - sHeight) / 2;
                }

                ctx.drawImage(img, sx, sy, sWidth, sHeight, config.visualX, config.visualY, config.visualWidth, config.visualHeight);
               
                ctx.restore();

                canvas.toBlob((blob) => {
                    const ext = selectedFormat === 'mo2' ? 'jpg' : 'png';
                    zip.file(file.name.replace(/\.[^/.]+$/, '') + `.${ext}`, blob);
                    resolve();
                }, selectedFormat === 'mo2' ? 'image/jpeg' : 'image/png');
            };
            img.src = URL.createObjectURL(file);
        });
    })).then(() => {
        zip.generateAsync({ type: 'blob' }).then(content => {
            saveAs(content, 'banners.zip');
        });
    });
});

document.getElementById('resetBtn').addEventListener('click', () => {
    location.reload();
});

function getFormatConfig(format) {
    if (format === 'biz2') {
        return {
            canvasWidth: 1029,
            canvasHeight: 258,
            visualX: 667,
            visualY: 35,
            visualWidth: 315,
            visualHeight: 186,
            borderRadius: 20
        };
    } else if (format === 'biz1') {
        return {
            canvasWidth: 1029,
            canvasHeight: 258,
            visualX: 260,
            visualY: 48,
            visualWidth: 163,
            visualHeight: 163,
            borderRadius: 20
        };
    } else if (format === 'mo2') {
        return {
            canvasWidth: 1200,
            canvasHeight: 600,
            visualX: 0,
            visualY: 103,
            visualWidth: 1200,
            visualHeight: 497,
            borderRadius: 0
        };
    }
}
