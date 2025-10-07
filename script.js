const { jsPDF } = window.jspdf;

// --- HTML 요소 찾기 ---
const fontSelector = document.getElementById('fontSelector');
const imageContainer = document.getElementById('imageContainer');
const addTitleBtn = document.getElementById('addTitleBtn');
const addTextBtn = document.getElementById('addTextBtn');
const fontSizeInput = document.getElementById('fontSize');
const addPhotoBtn = document.getElementById('addPhotoBtn');
const takePhotoBtn = document.getElementById('takePhotoBtn');
const exportBtn = document.getElementById('exportBtn');
const exportJpgBtn = document.getElementById('exportJpgBtn');
const deleteBtn = document.getElementById('deleteBtn');
const photoInput = document.getElementById('photoInput');
const cameraInput = document.getElementById('cameraInput');

let selectedElement = null;

// --- 이벤트 리스너 ---
addPhotoBtn.addEventListener('click', () => photoInput.click());
takePhotoBtn.addEventListener('click', () => cameraInput.click());
addTitleBtn.addEventListener('click', createTitleElement);
addTextBtn.addEventListener('click', createTextElement);
photoInput.addEventListener('change', (event) => handleFileSelect(event));
cameraInput.addEventListener('change', (event) => handleFileSelect(event));
exportBtn.addEventListener('click', generatePdf);
exportJpgBtn.addEventListener('click', generateJpg);
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
        const target = selectedElement.querySelector('h2') || selectedElement.querySelector('div[contenteditable="true"]');
        if (target) {
            target.style.fontSize = `${fontSizeInput.value}pt`;
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
        
        const target = selectedElement.querySelector('h2') || selectedElement.querySelector('div[contenteditable="true"]');
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

    const photoWrapper = document.createElement('div');
    photoWrapper.classList.add('photo-wrapper');
    
    const newImage = document.createElement('img');
    newImage.src = URL.createObjectURL(file);
    newImage.onload = () => {
        wrapper.dataset.ratio = newImage.naturalWidth / newImage.naturalHeight;
    };

    photoWrapper.appendChild(newImage);
    wrapper.appendChild(photoWrapper);
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

function createTextElement() {
    const wrapper = document.createElement('div');
    wrapper.className = 'text-element';
    makeElementSelectable(wrapper);

    const textBlock = document.createElement('div');
    textBlock.contentEditable = true;
    textBlock.textContent = '텍스트를 입력하세요';
    textBlock.style.fontSize = '12pt';
    
    wrapper.appendChild(textBlock);
    imageContainer.appendChild(wrapper);
}


// PDF 및 JPG 생성을 위한 공통 캡처 로직
function captureAndProcess(processor) {
    // 1. 선택된 요소 해제
    if (selectedElement) {
        selectedElement.classList.remove('selected');
        selectedElement = null;
        updateToolbar();
    }
    
    // 2. 캡처를 위해 편집 가능한 요소(h2, div)를 정적 요소(p)로 임시 변경
    const elementsToRestore = [];
    const processElement = (element) => {
        const p = document.createElement('p');
        p.textContent = element.textContent;
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
    imageContainer.querySelectorAll('.title-element h2, .text-element div').forEach(processElement);
    
    // 3. html2canvas로 화면 캡처
    html2canvas(imageContainer, { scale: 2, useCORS: true }).then(canvas => {
        // 4. 콜백 함수(processor)를 통해 파일 유형에 맞게 처리
        processor(canvas);
        
        // 5. 임시로 변경했던 요소들 원래대로 복원
        elementsToRestore.forEach(item => {
            item.original.style.display = '';
            if (item.replacement.parentNode) {
                item.replacement.parentNode.removeChild(item.replacement);
            }
        });
    });
}

// PDF 생성 함수
function generatePdf() {
    captureAndProcess(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSiz
        e.getHeight();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('유니앱_문서.pdf');
    });
}

// JPG 생성 함수
function generateJpg() {
    captureAndProcess(canvas => {
        const imgData = canvas.toDataURL('image/jpeg', 0.95); // JPG 형식, 품질 95%
        const link = document.createElement('a');
        link.download = '유니앱_이미지.jpg';
        link.href = imgData;
        link.click();
    });
}


// 공통 드래그 리스너
const commonDragListeners = {
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
        const style = window.getComputedStyle(target);

        const x = parseFloat(target.style.left) || parseFloat(style.left);
        const y = parseFloat(target.style.top) || parseFloat(style.top);

        target.dataset.x = x;
        target.dataset.y = y;
    }
};

// 제목 및 텍스트 요소 드래그 설정
interact('.title-element, .text-element')
  .draggable({
    listeners: commonDragListeners,
    modifiers: [interact.modifiers.restrictRect({ restriction: '#marginGuide' })]
  });

// 사진 요소(.draggable) 드래그 및 크기 조절 설정
interact('.draggable')
  .draggable({
    listeners: commonDragListeners,
    modifiers: [interact.modifiers.restrictRect({ restriction: '#marginGuide' })]
  })
  .resizable({
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

// 마우스 오른쪽 클릭 및 길게 누르기 기본 메뉴 비활성화
window.addEventListener('contextmenu', function (e) { 
  if (e.target.tagName === 'IMG'){
    e.preventDefault(); 
  }
});