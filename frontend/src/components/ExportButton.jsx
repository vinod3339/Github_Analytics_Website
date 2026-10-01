import React, { useState } from 'react';
import { Dropdown, Spinner } from 'react-bootstrap';
import { downloadExport } from '../utils/exportUtils';

const ExportButton = ({ dataType, label = 'Export Data', size = 'md' }) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    setExporting(true);
    await downloadExport(dataType, format);
    setExporting(false);
  };

  return (
    <Dropdown>
      <Dropdown.Toggle
        variant="outline-secondary"
        size={size}
        id={`dropdown-export-${dataType}`}
        disabled={exporting}
        className="d-flex align-items-center gap-2"
      >
        {exporting ? (
          <Spinner animation="border" size="sm" />
        ) : (
          <i className="bi bi-download"></i>
        )}
        <span>{label}</span>
      </Dropdown.Toggle>

      <Dropdown.Menu align="end">
        <Dropdown.Header>Select Export Format</Dropdown.Header>
        <Dropdown.Item onClick={() => handleExport('csv')} className="d-flex align-items-center gap-2">
          <i className="bi bi-filetype-csv text-primary"></i>
          Export as CSV (.csv)
        </Dropdown.Item>
        <Dropdown.Item onClick={() => handleExport('excel')} className="d-flex align-items-center gap-2">
          <i className="bi bi-file-earmark-excel text-success"></i>
          Export as Excel (.xlsx)
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default ExportButton;
