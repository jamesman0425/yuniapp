const { jsPDF } = window.jspdf;

// --- HTML 요소 찾기 ---
const fontSelector = document.getElementById('fontSelector');
const imageContainer = document.getElementById('imageContainer');
const addTitleBtn = document.getElementById('addTitleBtn');
const fontSizeInput = document.getElementById('fontSize');
const addPhotoBtn = document.getElementById('addPhotoBtn');
const takePhotoBtn = document.getElementById('takePhotoBtn');
const exportBtn = document.getElementById('exportBtn');
const exportJpgBtn = document.getElementById('exportJpgBtn'); // JPG 버튼 추가
const deleteBtn = document.getElementById('deleteBtn');
const photoInput = document.getElementById('photoInput');
const cameraInput = document.getElementById('cameraInput');

let selectedElement = null;

// --- 이벤트 리스너 ---
addPhotoBtn.addEventListener('click', () => photoInput.click());
takePhotoBtn.addEventListener('click', () => cameraInput.click());
addTitleBtn.addEventListener('click', createTitleElement);
photoInput.addEventListener('change', (event) => handleFileSelect(event));
cameraInput.addEventListener('change', (event) => handleFileSelect(event));
exportBtn.addEventListener('click', generatePdf);
exportJpgBtn.addEventListener('click', generateJpg); // JPG 버튼 리스너 추가
fontSelector.addEventListener('change', (event) => applyFont(event.target.value));
fontSizeInput.addEventListener('input', () => applyFontSizes());
deleteBtn.addEventListener('click', deleteSelectedElement);

document.addEventListener('DOMContentLoaded', () => {
    applyFont(fontSelector.value);
});

imageContainer.addEventListener('click', (e) => {
    if (e.target === imageContainer || e.target === document.getElementById('marginGuide')) {
        if(selectedElement) {
            selectedElement.classList.remove('selected');
            selectedElement = null;
        }
        updateToolbar();
    }
});

function updateToolbar() {
    deleteBtn.disabled = selectedElement === null;
}

function deleteSelectedElement() {
    if (selectedElement) {
        selectedElement.remove();
        selectedElement = null;
        updateToolbar();
    }
}

function applyFont(fontValue) {
    const selectedFont = fontValue.toLowerCase();
    const classList = Array.from(fontSelector.options).map(o => `font-${o.value.toLowerCase()}`);
    document.body.classList.remove(...classList);
    document.body.classList.add(`font-${selectedFont}`);
}

function applyFontSizes() {
    if (selectedElement) {
        const target = selectedElement.querySelector('h2') || selectedElement.querySelector('input');
        if (target) {
            target.style.fontSize = `${fontSizeInput.value}px`;
        }
    }
}

function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        for(const file of files) {
            displayImageAndText(file);
        }
    }
    event.target.value = '';
}

function makeElementSelectable(element) {
    element.addEventListener('click', (e) => {
        e.stopPropagation();
        if(selectedElement) {
            selectedElement.classList.remove('selected');
        }
        selectedElement = element;
        selectedElement.classList.add('selected');
        
        const target = selectedElement.querySelector('h2') || selectedElement.querySelector('input');
        if (target) {
            fontSizeInput.value = parseInt(getComputedStyle(target).fontSize);
        }
        updateToolbar();
    });
}

function displayImageAndText(file) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('draggable');
    makeElementSelectable(wrapper);
    
    wrapper.style.top = '100px';
    wrapper.style.left = '50px';

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.placeholder = '사진설명';
    textInput.style.fontSize = `14px`;
    
    const photoWrapper = document.createElement('div');
    photoWrapper.classList.add('photo-wrapper');
    const textWrapper = document.createElement('div');
    textWrapper.classList.add('text-wrapper');
    const newImage = document.createElement('img');
    newImage.src = URL.createObjectURL(file);
    newImage.onload = () => {
        wrapper.dataset.ratio = newImage.naturalWidth / newImage.naturalHeight;
    };

    const swapButton = document.createElement('button');
    swapButton.textContent = '위/아래';
    swapButton.classList.add('swap-btn');
    swapButton.addEventListener('click', (e) => {
        e.stopPropagation();
        wrapper.classList.toggle('text-on-top');
    });
    photoWrapper.appendChild(newImage);
    textWrapper.appendChild(textInput);
    wrapper.appendChild(photoWrapper);
    wrapper.appendChild(textWrapper);
    wrapper.appendChild(swapButton);
    imageContainer.appendChild(wrapper);
}

function createTitleElement() {
    const wrapper = document.createElement('div');
    wrapper.className = 'title-element';
    makeElementSelectable(wrapper);

    const title = document.createElement('h2');
    title.contentEditable = true;
    title.textContent = '제목을 입력하세요';
    title.style.fontSize = `28px`;
    
    wrapper.appendChild(title);
    imageContainer.appendChild(wrapper);
}

// --- (새로 추가) 캡처 준비 및 복원 함수 ---
function prepareForCapture() {
    if (selectedElement) {
        selectedElement.classList.remove('selected');
        selectedElement = null;
        updateToolbar();
    }
    
    const elementsToRestore = [];
    const processElement = (element) => {
        const p = document.createElement('p');
        p.textContent = element.tagName === 'H2' ? element.textContent : element.value;
        const computedStyle = getComputedStyle(element);
        p.style.fontFamily = computedStyle.fontFamily;
        p.style.fontSize = computedStyle.fontSize;
        p.style.padding = computedStyle.padding;
        p.style.margin = '0';
        p.style.boxSizing = 'border-box';
        p.style.width = '100%';
        p.style.textAlign = 'center';
        elementsToRestore.push({ original: element, replacement: p });
        element.style.display = 'none';
        element.parentNode.insertBefore(p, element);
    };
    imageContainer.querySelectorAll('.title-element h2').forEach(processElement);
    imageContainer.querySelectorAll('.draggable input').forEach(processElement);
    const swapButtons = imageContainer.querySelectorAll('.swap-btn');
    swapButtons.forEach(btn => btn.style.display = 'none');
    
    return { elementsToRestore, swapButtons };
}

function restoreAfterCapture({ elementsToRestore, swapButtons }) {
    elementsToRestore.forEach(item => {
        item.original.style.display = '';
        if (item.replacement.parentNode) {
            item.replacement.parentNode.removeChild(item.replacement);
        }
    });
    swapButtons.forEach(btn => btn.style.display = '');
}

// --- (새로 추가) JPG 생성 함수 ---
function generateJpg() {
    const captureState = prepareForCapture();
    html2canvas(imageContainer, { scale: 2, useCORS: true }).then(canvas => {
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const link = document.createElement('a');
        link.href = imgData;
        link.download = '유니앱_문서.jpg';
        link.click();
        restoreAfterCapture(captureState);
    });
}

// (수정) PDF 생성 함수가 공통 함수를 사용하도록 변경
function generatePdf() {
    const captureState = prepareForCapture();
    html2canvas(imageContainer, { scale: 2, useCORS: true }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('유니앱_문서.pdf');
        restoreAfterCapture(captureState);
    });
}

interact('.draggable, .title-element')
  .draggable({
    ignoreFrom: 'input, button, select, h2',
    listeners: {
      move(event) {
        const target = event.target;
        let x = (parseFloat(target.dataset.x) || 0) + event.dx;
        let y = (parseFloat(target.dataset.y) || 0) + event.dy;

        target.style.left = x + 'px';
        target.style.top = y + 'px';

        target.dataset.x = x;
        target.dataset.y = y;
      },
      start(event) {
        const target = event.target;
        target.dataset.x = parseFloat(target.style.left) || 0;
        target.dataset.y = parseFloat(target.style.top) || 0;
      }
    },
    modifiers: [interact.modifiers.restrictRect({ restriction: '#marginGuide' })]
  })
  .resizable({
    ignoreFrom: 'input, button, select, h2',
    edges: { top: true, left: true, bottom: true, right: true },
    listeners: {
        move: function (event) {
            let target = event.target;
            let x = (parseFloat(target.dataset.x) || 0);
            let y = (parseFloat(target.dataset.y) || 0);
            let newWidth = event.rect.width;
            let newHeight = event.rect.height;
            const isCornerResize = (event.edges.left || event.edges.right) && (event.edges.top || event.edges.bottom);
            if (isCornerResize && target.dataset.ratio) {
                const ratio = parseFloat(target.dataset.ratio);
                newHeight = newWidth / ratio;
            }
            target.style.width = newWidth + 'px';
            target.style.height = newHeight + 'px';
            x += event.deltaRect.left;
            y += event.deltaRect.top;
            target.style.left = x + 'px';
            target.style.top = y + 'px';
            target.dataset.x = x;
            target.dataset.y = y;
        }
    },
    modifiers: [
        interact.modifiers.restrictSize({ min: { width: 80, height: 80 } }),
        interact.modifiers.restrictRect({ restriction: '#marginGuide' })
    ],
    inertia: true
  });

window.addEventListener('contextmenu', function (e) { 
  if (e.target.tagName === 'IMG'){
    e.preventDefault(); 
  }
});