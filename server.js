const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); // uuid 패키지 불러오기

const app = express();
const port = 8082;
const filePath = 'taskList.json';

// Middleware 설정
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json()); // JSON 요청 본문 파싱

// 기본 라우트 설정
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// 작업 목록 읽기
app.get('/tasks', (req, res) => {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading file');
    }
    const tasks = data ? JSON.parse(data) : [];
    res.json(tasks);
  });
});

// 작업 추가
app.post('/tasks', (req, res) => {
  const { title, description, position } = req.body;

  fs.readFile(filePath, 'utf8', (err, data) => {
    let tasksArray = [];

    if (!err && data) {
      tasksArray = JSON.parse(data);
    }

    const newId = uuidv4();
    const newTask = { id: newId, title, description, position }; // position 추가
    tasksArray.push(newTask);

    fs.writeFile(filePath, JSON.stringify(tasksArray, null, 2), (err) => {
      if (err) {
        return res.status(500).send('Error writing file');
      }
      res.status(201).json(newTask);
    });
  });
});

app.delete('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading file');
    }

    let tasksArray = data ? JSON.parse(data) : [];
    const taskIndex = tasksArray.findIndex(task => task.id === taskId);

    if (taskIndex > -1) {
      tasksArray.splice(taskIndex, 1); // 작업 삭제
      fs.writeFile(filePath, JSON.stringify(tasksArray, null, 2), (err) => {
        if (err) {
          return res.status(500).send('Error writing file');
        }
        res.status(204).send(); // 204 No Content
      });
    } else {
      res.status(404).send('Task not found');
    }
  });
});

// 작업 위치 업데이트
app.patch('/tasks/:id', (req, res) => {
  const taskId = req.params.id; // UUID를 그대로 사용
  const { position } = req.body; // 클라이언트로부터 받은 position

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading file');
    }

    let tasksArray = data ? JSON.parse(data) : [];
    const taskIndex = tasksArray.findIndex(task => task.id === taskId);

    if (taskIndex > -1) {
      tasksArray[taskIndex].position = position; // 위치 업데이트
      fs.writeFile(filePath, JSON.stringify(tasksArray, null, 2), (err) => {
        if (err) {
          return res.status(500).send('Error writing file');
        }
        res.status(200).send('Task position updated successfully');
      });
    } else {
      res.status(404).send('Task not found');
    }
  });
});