// 전역 변수로 jspdf를 사용하기 위해 설정
const { jsPDF } = window.jspdf;

// HTML 요소들을 미리 찾아놓습니다.
const addPhotoBtn = document.getElementById('addPhotoBtn');
const takePhotoBtn = document.getElementById('takePhotoBtn'); // 새로 추가
const exportBtn = document.getElementById('exportBtn');
const photoInput = document.getElementById('photoInput');
const cameraInput = document.getElementById('cameraInput'); // 새로 추가
const imageContainer = document.getElementById('imageContainer');
const documentTitle = document.getElementById('documentTitle');

// --- 이벤트 리스너 설정 ---

// '갤러리에서 추가' 버튼 클릭 시
addPhotoBtn.addEventListener('click', () => {
  photoInput.click();
});

// '직접 사진 촬영' 버튼 클릭 시
takePhotoBtn.addEventListener('click', () => {
  cameraInput.click();
});

// 'PDF로 저장' 버튼 클릭 시
exportBtn.addEventListener('click', () => {
    html2canvas(imageContainer).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.setFontSize(22);
        const title = documentTitle.value || "제목 없음";
        pdf.text(title, pdfWidth / 2, 20, { align: 'center' });
        pdf.save('유니앱_문서.pdf');
    });
});

// 갤러리에서 파일을 선택했을 때
photoInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    displayImage(file); // 이미지를 화면에 표시하는 함수 호출
  }
});

// 카메라로 사진을 찍었을 때
cameraInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    displayImage(file); // 동일한 함수 호출
  }
});


// --- 공통 기능 함수 ---

/**
 * 선택되거나 촬영된 이미지 파일을 화면에 표시하는 함수
 * @param {File} file - 표시할 이미지 파일
 */
function displayImage(file) {
  const newImage = document.createElement('img');
  newImage.src = URL.createObjectURL(file);
  newImage.classList.add('draggable'); 
  imageContainer.appendChild(newImage);
}


// --- interact.js 설정 (드래그 & 리사이즈) ---
interact('.draggable')
  .draggable({
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
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: 'parent'
      })
    ]
  })
  .resizable({
    edges: { top: true, left: true, bottom: true, right: true },
    listeners: {
      move(event) {
        const target = event.target;
        let x = (parseFloat(target.getAttribute('data-x')) || 0);
        let y = (parseFloat(target.getAttribute('data-y')) || 0);
        target.style.width = event.rect.width + 'px';
        target.style.height = event.rect.height + 'px';
        x += event.deltaRect.left;
        y += event.deltaRect.top;
        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
      }
    },
    modifiers: [
      interact.modifiers.restrictSize({
        min: { width: 50, height: 50 }
      })
    ]
  });