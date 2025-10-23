import api from './api';

// Institutions
export async function fetchInstitutions(params = {}) {
  const res = await api.get('/api/institutions', { params });
  return res.data?.institutions || [];
}

export async function fetchInstitutionById(id) {
  const res = await api.get(`/api/institutions/${id}`);
  return res.data?.institution || null;
}

// Courses
export async function fetchCourses(params = {}) {
  const res = await api.get('/api/courses', { params });
  return res.data?.courses || [];
}

export async function fetchCourseById(id) {
  const res = await api.get(`/api/courses/${id}`);
  return res.data?.course || null;
}

// Student content (requires auth)
export async function fetchStudentCourseContent(courseId, params = {}) {
  const res = await api.get(`/api/student/course/${courseId}/content`, { params });
  return res.data || { content: [], subscriptions: {}, subscriptionInfo: null };
}

// General resources (public listing; premium fields locked by backend)
export async function fetchResources(params = {}) {
  const res = await api.get('/api/resources', { params });
  return res.data?.resources || [];
}

// Public success stories
export async function fetchSuccessStories(limit = 6) {
  const res = await api.get('/api/public/success-stories', { params: { limit } });
  return res.data?.stories || [];
}
