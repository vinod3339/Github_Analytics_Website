import api from '../services/api';

export const downloadExport = async (dataType, format = 'csv') => {
  try {
    const response = await api.get(`/export/${dataType}?format=${format}`, {
      responseType: 'blob',
    });

    const extension = format === 'csv' ? 'csv' : 'xlsx';
    const filename = `github_tracking_${dataType}_${new Date().toISOString().slice(0, 10)}.${extension}`;

    const blob = new Blob([response.data], {
      type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Export download failed:', error);
    alert('Failed to download export file. Please try again.');
  }
};
