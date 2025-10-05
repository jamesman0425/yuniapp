const { jsPDF } = window.jspdf;

// --- HTML 요소 찾기 ---
const fontSelector = document.getElementById('fontSelector');
const imageContainer = document.getElementById('imageContainer');
const addTitleBtn = document.getElementById('addTitleBtn');
const fontSizeInput = document.getElementById('fontSize');
const addPhotoBtn = document.getElementById('addPhotoBtn');
const takePhotoBtn = document.getElementById('takePhotoBtn');
const exportBtn = document.getElementById('exportBtn');
const photoInput = document.getElementById('photoInput');
const cameraInput = document.getElementById('cameraInput');

let selectedElement = null;

// --- 이벤트 리스너 ---
addPhotoBtn.addEventListener('click', () => photoInput.click());
takePhotoBtn.addEventListener('click', () => cameraInput.click());
addTitleBtn.addEventListener('click', createTitleElement);
photoInput.addEventListener('change', (event) => handleFileSelect(event));
cameraInput.addEventListener('change', (event) => handleFileSelect(event));
exportBtn.addEventListener('click', () => generatePdf());
fontSelector.addEventListener('change', (event) => applyFont(event.target.value));
fontSizeInput.addEventListener('input', () => applyFontSizes());

document.addEventListener('DOMContentLoaded', () => {
    applyFont(fontSelector.value);
});

imageContainer.addEventListener('click', (e) => {
    if (e.target === imageContainer || e.target === document.getElementById('marginGuide')) {
        if(selectedElement) {
            selectedElement.classList.remove('selected');
            selectedElement = null;
        }
    }
});

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
    });
}

function displayImageAndText(file) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('draggable');
    makeElementSelectable(wrapper);
    
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

function generatePdf() {
    if (selectedElement) {
        selectedElement.classList.remove('selected');
        selectedElement = null;
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
    
    html2canvas(imageContainer, { scale: 2, useCORS: true }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('유니앱_문서.pdf');
        
        elementsToRestore.forEach(item => {
            item.original.style.display = '';
            if (item.replacement.parentNode) {
                item.replacement.parentNode.removeChild(item.replacement);
            }
        });

        swapButtons.forEach(btn => btn.style.display = '');
    });
}


interact('.draggable, .title-element')
  .draggable({
    // --- (수정된 부분) allowFrom 옵션을 제거하여 모든 객체가 움직이도록 함 ---
    ignoreFrom: 'input, button, select',
    listeners: {
      move(event) {
        const target = event.target;
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
      },
    },
    modifiers: [interact.modifiers.restrictRect({ restriction: '#marginGuide' })]
  })
  .resizable({
    // --- (수정된 부분) allowFrom 옵션을 제거하여 모든 객체가 조절되도록 함 ---
    ignoreFrom: 'input, button, select',
    edges: { top: true, left: true, bottom: true, right: true },
    listeners: {
      move(event) {
        const target = event.target;
        let x = (parseFloat(target.getAttribute('data-x')) || 0);
        let y = (parseFloat(target.getAttribute('data-y')) || 0);
        target.style.width = event.rect.width + 'px';
        target.style.height = 'auto';

        if (target.classList.contains('title-element')) {
            const h2 = target.querySelector('h2');
            const newSize = event.rect.width / 15;
            h2.style.fontSize = `${newSize < 12 ? 12 : newSize}px`;
        }

        x += event.deltaRect.left;
        y += event.deltaRect.top;
        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
      }
    },
    modifiers: [
        interact.modifiers.restrictSize({ min: { width: 100 } }),
        interact.modifiers.restrictRect({ restriction: '#marginGuide' })
    ]
  });