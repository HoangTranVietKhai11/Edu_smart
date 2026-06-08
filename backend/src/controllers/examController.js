const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamResult = require('../models/ExamResult');
const Class = require('../models/Class');

// @desc   Get exams
// @route  GET /api/exams
// @access Private
exports.getExams = async (req, res) => {
  const { classId } = req.query;
  const query = {};

  if (classId) query.class = classId;

  if (req.user.role === 'teacher') {
    query.createdBy = req.user._id;
  } else {
    const myClasses = await Class.find({ students: req.user._id }).select('_id');
    query.class = { $in: myClasses.map(c => c._id) };
    query.isPublished = true;
  }

  const exams = await Exam.find(query)
    .populate('class', 'name subject grade')
    .populate('createdBy', 'name')
    .sort('-createdAt');

  // Add student result status
  if (req.user.role === 'student') {
    const examIds = exams.map(e => e._id);
    const results = await ExamResult.find({ student: req.user._id, exam: { $in: examIds } })
      .select('exam totalScore percentage isPassed status');

    const resultMap = {};
    results.forEach(r => { resultMap[r.exam.toString()] = r; });

    const examsWithStatus = exams.map(e => ({
      ...e.toJSON(),
      myResult: resultMap[e._id.toString()] || null,
    }));

    return res.json({ success: true, data: examsWithStatus });
  }

  res.json({ success: true, data: exams });
};

// @desc   Get single exam
// @route  GET /api/exams/:id
// @access Private
exports.getExam = async (req, res) => {
  const exam = await Exam.findById(req.params.id)
    .populate('class', 'name subject grade')
    .populate('createdBy', 'name');

  if (!exam) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy bài kiểm tra.' });
  }

  let questions = await Question.find({ exam: exam._id }).sort('order');

  // Hide correct answers for students
  if (req.user.role === 'student') {
    questions = questions.map(q => {
      const qObj = q.toObject();
      if (q.type === 'multiple-choice') {
        qObj.options = qObj.options.map(o => ({ _id: o._id, text: o.text }));
      }
      delete qObj.correctAnswer;
      return qObj;
    });
  }

  res.json({ success: true, data: { ...exam.toJSON(), questions } });
};

// @desc   Create exam
// @route  POST /api/exams
// @access Private/Teacher
exports.createExam = async (req, res) => {
  req.body.createdBy = req.user._id;
  const { questions, ...examData } = req.body;
  const exam = await Exam.create(examData);

  if (questions && questions.length > 0) {
    const createdQuestions = [];
    for (const qData of questions) {
      const q = await Question.create({
        exam: exam._id,
        createdBy: req.user._id,
        content: qData.content,
        type: qData.type || 'multiple-choice',
        points: qData.points || 1,
        explanation: qData.explanation || '',
        options: qData.options || [],
      });
      createdQuestions.push(q._id);
    }
    exam.questions = createdQuestions;
    await exam.save();
  }

  res.status(201).json({ success: true, data: exam });
};

// @desc   Update exam
// @route  PUT /api/exams/:id
// @access Private/Teacher
exports.updateExam = async (req, res) => {
  const exam = await Exam.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!exam) return res.status(404).json({ success: false, message: 'Không tìm thấy bài kiểm tra.' });
  res.json({ success: true, data: exam });
};

// @desc   Delete exam
// @route  DELETE /api/exams/:id
// @access Private/Teacher
exports.deleteExam = async (req, res) => {
  await Exam.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
  await Question.deleteMany({ exam: req.params.id });
  res.json({ success: true, message: 'Đã xóa bài kiểm tra.' });
};

// @desc   Add question to exam
// @route  POST /api/exams/:id/questions
// @access Private/Teacher
exports.addQuestion = async (req, res) => {
  req.body.exam = req.params.id;
  req.body.createdBy = req.user._id;
  const question = await Question.create(req.body);

  // Add to exam
  await Exam.findByIdAndUpdate(req.params.id, { $push: { questions: question._id } });

  res.status(201).json({ success: true, data: question });
};

// @desc   Update question
// @route  PUT /api/exams/:id/questions/:qId
// @access Private/Teacher
exports.updateQuestion = async (req, res) => {
  const question = await Question.findByIdAndUpdate(req.params.qId, req.body, { new: true });
  res.json({ success: true, data: question });
};

// @desc   Delete question
// @route  DELETE /api/exams/:id/questions/:qId
// @access Private/Teacher
exports.deleteQuestion = async (req, res) => {
  await Question.findByIdAndDelete(req.params.qId);
  await Exam.findByIdAndUpdate(req.params.id, { $pull: { questions: req.params.qId } });
  res.json({ success: true, message: 'Đã xóa câu hỏi.' });
};

// @desc   Submit exam
// @route  POST /api/exams/:id/submit
// @access Private/Student
exports.submitExam = async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ success: false, message: 'Không tìm thấy bài kiểm tra.' });

  const now = new Date();
  if (now < exam.openAt || now > exam.closeAt) {
    return res.status(400).json({ success: false, message: 'Bài kiểm tra không trong thời gian làm bài.' });
  }

  // Check attempt count
  const attemptCount = await ExamResult.countDocuments({ exam: exam._id, student: req.user._id });
  if (attemptCount >= exam.maxAttempts) {
    return res.status(400).json({ success: false, message: 'Bạn đã hết lượt làm bài.' });
  }

  const { answers, startedAt, cheatWarnings, isCheated } = req.body;

  // Grade multiple-choice questions
  const questions = await Question.find({ exam: exam._id });
  let totalScore = 0;

  const gradedAnswers = answers.map(ans => {
    const question = questions.find(q => q._id.toString() === ans.questionId);
    if (!question) return ans;

    let isCorrect = false;
    let points = 0;

    if (question.type === 'multiple-choice') {
      const correctOption = question.options.find(o => o.isCorrect);
      isCorrect = correctOption && correctOption._id.toString() === ans.selectedOption;
      if (isCorrect) {
        points = question.points;
        totalScore += points;
      }
    }

    return {
      question: question._id,
      answer: ans.answer || '',
      selectedOption: ans.selectedOption,
      isCorrect,
      points,
    };
  });

  const percentage = exam.totalPoints > 0 ? (totalScore / exam.totalPoints) * 100 : 0;
  const isPassed = totalScore >= exam.passingScore;

  const result = await ExamResult.create({
    exam: exam._id,
    student: req.user._id,
    answers: gradedAnswers,
    totalScore,
    maxScore: exam.totalPoints,
    percentage: Math.round(percentage * 10) / 10,
    isPassed,
    attemptNumber: attemptCount + 1,
    startedAt: new Date(startedAt),
    submittedAt: now,
    timeSpent: Math.floor((now.getTime() - new Date(startedAt).getTime()) / 1000),
    status: 'submitted',
    cheatWarnings: cheatWarnings || 0,
    isCheated: isCheated || false,
  });

  res.status(201).json({ success: true, data: result });
};

// @desc   Get exam results
// @route  GET /api/exams/:id/results
// @access Private
exports.getExamResults = async (req, res) => {
  const query = { exam: req.params.id };
  if (req.user.role === 'student') query.student = req.user._id;

  const results = await ExamResult.find(query)
    .populate('student', 'name avatar email')
    .sort('-submittedAt');

  res.json({ success: true, data: results });
};

// @desc   Extract questions from file (Word/PDF)
// @route  POST /api/exams/:id/extract-from-file
// @access Private/Teacher
exports.extractQuestionsFromFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Vui lòng tải lên file Word hoặc PDF.' });
  }

  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ success: false, message: 'Không tìm thấy bài kiểm tra.' });

  try {
    const fs = require('fs');
    const FormData = require('form-data');
    const axios = require('axios');
    const path = require('path');

    const filePath = path.join(__dirname, '../', `/uploads/docs/${req.file.filename}`);
    
    // Fallback if the file was saved somewhere else by upload middleware
    const actualFilePath = fs.existsSync(filePath) ? filePath : req.file.path;

    const form = new FormData();
    form.append('file', fs.createReadStream(actualFilePath));

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    // Call AI Service
    const response = await axios.post(`${AI_SERVICE_URL}/extract/extract-exam`, form, {
      headers: {
        ...form.getHeaders()
      },
      timeout: 60000 // 60s timeout for OCR & LLM
    });

    const questionsData = response.data.data;
    
    if (!questionsData || questionsData.length === 0) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy câu hỏi nào trong file.' });
    }

    // Save questions to DB
    const createdQuestions = [];
    for (const qData of questionsData) {
      const q = await Question.create({
        exam: exam._id,
        createdBy: req.user._id,
        content: qData.content,
        type: qData.type || 'multiple-choice',
        points: qData.points || 1,
        explanation: qData.explanation || '',
        options: qData.options || [],
      });
      createdQuestions.push(q._id);
    }

    // Attach to exam
    await Exam.findByIdAndUpdate(exam._id, { $push: { questions: { $each: createdQuestions } } });

    res.json({ success: true, message: `Đã trích xuất và lưu ${createdQuestions.length} câu hỏi.`, count: createdQuestions.length });

  } catch (error) {
    console.error('Extract file error:', error.message);
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi phân tích file. AI có thể đang quá tải hoặc file không đúng định dạng.' });
  }
};

// @desc   Extract questions from file (Without saving to DB)
// @route  POST /api/exams/extract
// @access Private/Teacher
exports.extractQuestionsOnly = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Vui lòng tải lên file Word hoặc PDF.' });
  }

  try {
    const fs = require('fs');
    const FormData = require('form-data');
    const axios = require('axios');
    const path = require('path');

    const filePath = path.join(__dirname, '../', `/uploads/docs/${req.file.filename}`);
    const actualFilePath = fs.existsSync(filePath) ? filePath : req.file.path;

    const form = new FormData();
    form.append('file', fs.createReadStream(actualFilePath));

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    const response = await axios.post(`${AI_SERVICE_URL}/extract/extract-exam`, form, {
      headers: form.getHeaders(),
      timeout: 60000 
    });

    const questionsData = response.data.data;
    if (!questionsData || questionsData.length === 0) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy câu hỏi nào trong file.' });
    }

    res.json({ success: true, data: questionsData, message: `Đã trích xuất ${questionsData.length} câu hỏi.` });
  } catch (error) {
    console.error('Extract only error:', error.message);
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi phân tích file bằng AI.' });
  }
};
