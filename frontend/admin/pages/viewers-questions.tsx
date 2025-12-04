import React, { useState, useEffect } from 'react';
import { viewersApi, questionsApi, uploadApi, Viewer, Question } from '../lib/api';
import Link from 'next/link';

export default function ViewersQuestionsPage() {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showViewerForm, setShowViewerForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedViewer, setSelectedViewer] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const [viewerFormData, setViewerFormData] = useState({
    name: '',
    city: '',
    country: '',
    email: '',
    phone: '',
    photo_url: '',
  });

  const [questionFormData, setQuestionFormData] = useState({
    text: '',
    type: 'text',
    answer: '',
    keywords: '',
    media_url: '',
    media_thumbnail_url: '',
    difficulty: 3,
    category: '',
    is_approved: false,
    question_status: 'pending',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [viewersRes, questionsRes] = await Promise.all([
        viewersApi.getAll(),
        questionsApi.getAll(),
      ]);
      setViewers(viewersRes.data);
      setQuestions(questionsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'media' | 'thumbnail') => {
    try {
      setUploading(true);
      const response = await uploadApi.uploadMedia(file);
      const url = response.data.url;
      
      if (type === 'media') {
        setQuestionFormData({ ...questionFormData, media_url: url });
      } else {
        setQuestionFormData({ ...questionFormData, media_thumbnail_url: url });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Ошибка загрузки файла');
    } finally {
      setUploading(false);
    }
  };

  const handleViewerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const viewer = await viewersApi.create(viewerFormData);
      setSelectedViewer(viewer.data.id);
      setShowViewerForm(false);
      setShowQuestionForm(true);
      await loadData();
    } catch (error) {
      console.error('Error creating viewer:', error);
      alert('Ошибка создания телезрителя');
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...questionFormData,
        viewer_id: selectedViewer || null,
        keywords: questionFormData.keywords.split(',').map(k => k.trim()).filter(k => k),
      };

      if (editingQuestion) {
        await questionsApi.update(editingQuestion.id, data);
      } else {
        await questionsApi.create(data);
      }

      await loadData();
      resetQuestionForm();
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Ошибка сохранения вопроса');
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setSelectedViewer(question.viewer_id || '');
    setQuestionFormData({
      text: question.text,
      type: question.type,
      answer: question.answer,
      keywords: question.keywords.join(', '),
      media_url: question.media_url || '',
      media_thumbnail_url: question.media_thumbnail_url || '',
      difficulty: question.difficulty || 3,
      category: question.category || '',
      is_approved: question.is_approved,
      question_status: question.question_status || 'pending',
    });
    setShowQuestionForm(true);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот вопрос?')) {
      return;
    }
    try {
      await questionsApi.update(id, { question_status: 'deleted' });
      await loadData();
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Ошибка удаления вопроса');
    }
  };

  const handleStatusChange = async (questionId: string, status: string) => {
    try {
      await questionsApi.update(questionId, { question_status: status });
      await loadData();
    } catch (error) {
      console.error('Error updating question status:', error);
    }
  };

  const resetQuestionForm = () => {
    setEditingQuestion(null);
    setSelectedViewer('');
    setQuestionFormData({
      text: '',
      type: 'text',
      answer: '',
      keywords: '',
      media_url: '',
      media_thumbnail_url: '',
      difficulty: 3,
      category: '',
      is_approved: false,
      question_status: 'pending',
    });
    setShowQuestionForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Управление Телезрителями и Вопросами</h1>
          <div className="space-x-4">
            <Link
              href="/"
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Назад
            </Link>
            <button
              onClick={() => {
                setShowViewerForm(true);
                setShowQuestionForm(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Добавить Телезрителя и Вопрос
            </button>
          </div>
        </div>

        {showViewerForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Добавить Телезрителя</h2>
            <form onSubmit={handleViewerSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
                  <input
                    type="text"
                    required
                    value={viewerFormData.name}
                    onChange={(e) => setViewerFormData({ ...viewerFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Город</label>
                  <input
                    type="text"
                    value={viewerFormData.city}
                    onChange={(e) => setViewerFormData({ ...viewerFormData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Страна</label>
                  <input
                    type="text"
                    value={viewerFormData.country}
                    onChange={(e) => setViewerFormData({ ...viewerFormData, country: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={viewerFormData.email}
                    onChange={(e) => setViewerFormData({ ...viewerFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  <input
                    type="tel"
                    value={viewerFormData.phone}
                    onChange={(e) => setViewerFormData({ ...viewerFormData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Фото</label>
                  <input
                    type="url"
                    value={viewerFormData.photo_url}
                    onChange={(e) => setViewerFormData({ ...viewerFormData, photo_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Создать и Перейти к Вопросу
              </button>
            </form>
          </div>
        )}

        {showQuestionForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              {editingQuestion ? 'Редактировать Вопрос' : 'Добавить Вопрос'}
            </h2>
            <form onSubmit={handleQuestionSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Телезритель</label>
                <select
                  value={selectedViewer}
                  onChange={(e) => setSelectedViewer(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">-- Выберите телезрителя --</option>
                  {viewers.map((viewer) => (
                    <option key={viewer.id} value={viewer.id}>
                      {viewer.name} {viewer.city ? `(${viewer.city})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Текст вопроса *</label>
                <textarea
                  required
                  value={questionFormData.text}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, text: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тип *</label>
                  <select
                    value={questionFormData.type}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="text">Текст</option>
                    <option value="video">Видео</option>
                    <option value="image">Изображение</option>
                    <option value="audio">Аудио</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ответ *</label>
                  <input
                    type="text"
                    required
                    value={questionFormData.answer}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, answer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ключевые слова (через запятую)</label>
                  <input
                    type="text"
                    value={questionFormData.keywords}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, keywords: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="история, наука, искусство"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Сложность (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={questionFormData.difficulty}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, difficulty: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                  <input
                    type="text"
                    value={questionFormData.category}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                  <select
                    value={questionFormData.question_status}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, question_status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="pending">Ожидает</option>
                    <option value="used">Использован</option>
                    <option value="deferred">Отложен</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Медиа-файл</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*,video/*,audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'media');
                    }}
                    disabled={uploading}
                    className="flex-1"
                  />
                  {questionFormData.media_url && (
                    <a
                      href={questionFormData.media_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Просмотреть
                    </a>
                  )}
                </div>
                {uploading && <p className="text-sm text-gray-500 mt-1">Загрузка...</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Миниатюра</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'thumbnail');
                    }}
                    disabled={uploading}
                    className="flex-1"
                  />
                  {questionFormData.media_thumbnail_url && (
                    <img
                      src={questionFormData.media_thumbnail_url}
                      alt="Thumbnail"
                      className="h-16 w-16 object-cover rounded"
                    />
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={questionFormData.is_approved}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, is_approved: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Одобрен</span>
                </label>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={resetQuestionForm}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <h2 className="text-xl font-bold p-4 bg-gray-50">Вопросы</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Вопрос</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Телезритель</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questions.map((question) => {
                  const viewer = viewers.find(v => v.id === question.viewer_id);
                  return (
                    <tr key={question.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md truncate">{question.text}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {viewer ? `${viewer.name} ${viewer.city ? `(${viewer.city})` : ''}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{question.type}</td>
                      <td className="px-6 py-4">
                        <select
                          value={question.question_status}
                          onChange={(e) => handleStatusChange(question.id, e.target.value)}
                          className="text-xs px-2 py-1 border rounded"
                        >
                          <option value="pending">Ожидает</option>
                          <option value="used">Использован</option>
                          <option value="deferred">Отложен</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button
                          onClick={() => handleEditQuestion(question)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

