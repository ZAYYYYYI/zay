import React from 'react';
import { Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import HomePage from './pages/HomePage/HomePage';
import DiagnosisPage from './pages/DiagnosisPage/DiagnosisPage';
import TasksPage from './pages/TasksPage/TasksPage';
import LogsPage from './pages/LogsPage/LogsPage';
import LogDetailPage from './pages/LogDetailPage/LogDetailPage';
import CareCardsPage from './pages/CareCardsPage/CareCardsPage';
import CareCardDetailPage from './pages/CareCardDetailPage/CareCardDetailPage';
import InspectionsPage from './pages/InspectionsPage/InspectionsPage';
import GitHubDownload from './pages/GitHubDownload/GitHubDownload';
import NotFound from './pages/NotFound/NotFound';

const RoutesComponent = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="diagnosis/:id" element={<DiagnosisPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="logs/:id" element={<LogDetailPage />} />
        <Route path="care-cards" element={<CareCardsPage />} />
        <Route path="care-cards/:id" element={<CareCardDetailPage />} />
        <Route path="inspections" element={<InspectionsPage />} />
        <Route path="github-download" element={<GitHubDownload />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;