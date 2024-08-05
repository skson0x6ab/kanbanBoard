const taskLists = document.querySelectorAll('.task-list');
const backlogTasks = document.querySelector('#backlog .task-list');
const titleInput = document.querySelector('#title');
const descriptionInput = document.querySelector('#description');
const submitButton = document.querySelector('#submit-button');
const errorContainer = document.querySelector('.error-container');

let tasks = [];

// 작업 목록 가져오기
async function fetchTasks() {
  const response = await fetch('/tasks');
  const data = await response.json();
  tasks = data;
  addTasks();
}

// DOM에 작업 추가
function createTask(taskId, title, description, position) {
  const taskCard = document.createElement('div');
  const taskHeader = document.createElement('div');
  const taskTitle = document.createElement('p');
  const taskDescriptionContainer = document.createElement('div');
  const taskDescription = document.createElement('p');
  const deleteIcon = document.createElement('p');

  taskCard.classList.add('task-container');
  taskHeader.classList.add('task-header');
  taskDescriptionContainer.classList.add('task-description-container');

  taskTitle.textContent = title;
  taskDescription.textContent = description;
  deleteIcon.textContent = '☒';

  taskCard.setAttribute('draggable', true);
  taskCard.setAttribute('task-id', taskId);

  taskCard.addEventListener('dragstart', dragStart);
  deleteIcon.addEventListener('click', deleteTask);

  taskHeader.append(taskTitle, deleteIcon);
  taskDescriptionContainer.append(taskDescription);
  taskCard.append(taskHeader, taskDescriptionContainer);

  // 위치에 따라 적절한 목록에 추가
  document.querySelector(`#${position} .task-list`).append(taskCard);
}

// 기존 작업 목록 추가
function addTasks() {
  tasks.forEach((task) => createTask(task.id, task.title, task.description, task.position));
}

// 작업 추가
async function addTask(e) {
  e.preventDefault();

  const filteredTitles = tasks.filter((task) => {
    return task.title === titleInput.value;
  });

  if (!filteredTitles.length) {
    const response = await fetch('/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: titleInput.value,
        description: descriptionInput.value,
        position: 'backlog', // 기본 위치
      }),
    });

    if (response.ok) {
      const newTask = await response.json();
      createTask(newTask.id, newTask.title, newTask.description, newTask.position);
      titleInput.value = '';
      descriptionInput.value = '';
    } else {
      showError('Error adding task');
    }
  } else {
    showError('Title must be unique!');
  }
}

submitButton.addEventListener('click', addTask);

// 드래그 앤 드롭 기능
let elementBeingDragged;

function dragStart() {
  elementBeingDragged = this;
}

function dragOver(e) {
  e.preventDefault();
}

async function dragDrop() {
  const columnId = this.parentNode.id; // 드롭된 위치의 ID를 가져옴
  this.append(elementBeingDragged); // 드래그된 요소를 드롭된 위치에 추가

  // 위치 정보 업데이트
  const taskId = elementBeingDragged.getAttribute('task-id');
  const taskIndex = tasks.findIndex(task => task.id == taskId);
  if (taskIndex > -1) {
    tasks[taskIndex].position = columnId; // 새로운 위치 저장

    // JSON 파일에 위치 정보 업데이트 요청
    await fetch(`/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ position: columnId }),
    });
  }
}

// 이벤트 리스너 등록
taskLists.forEach((taskList) => {
  taskList.addEventListener('dragover', dragOver);
  taskList.addEventListener('drop', dragDrop);
});

// 삭제 기능
function deleteTask() {
  const headerTitle = this.parentNode.firstChild.textContent;

  tasks = tasks.filter((task) => task.title !== headerTitle);
  this.parentNode.parentNode.remove();
}

// 오류 표시
function showError(message) {
  const errorMessage = document.createElement('p');
  errorMessage.textContent = message;
  errorMessage.classList.add('error-message');
  errorContainer.append(errorMessage);

  setTimeout(() => {
    errorContainer.textContent = '';
  }, 2000);
}

// 페이지 로드 시 작업 목록 가져오기
fetchTasks();
