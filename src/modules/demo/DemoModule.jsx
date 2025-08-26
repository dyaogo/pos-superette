import React, { useState } from 'react';
import Header from '../../components/Layout/Header';
import Sidebar from '../../components/Layout/Sidebar';
import Footer from '../../components/Layout/Footer';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataTable from '../../components/common/DataTable';
import ErrorBoundary from '../../components/common/ErrorBoundary';

const DemoModule = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const columns = ['name', 'value'];
  const data = [
    { name: 'Item 1', value: 100 },
    { name: 'Item 2', value: 200 }
  ];

  return (
    <ErrorBoundary>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header title="Components Demo" links={[{ href: '#', label: 'Home' }, { href: '#modal', label: 'Modal' }]} />
        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar>
            <button onClick={() => setModalOpen(true)}>Open Modal</button>
            <button onClick={() => setShowConfirm(true)}>Confirm</button>
          </Sidebar>
          <main style={{ flex: 1, padding: '1rem' }}>
            <Toast message="This is a toast" type="info" />
            <LoadingSpinner />
            <DataTable columns={columns} data={data} />
          </main>
        </div>
        <Footer>Demo Footer</Footer>

        <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)}>
          <h2>Simple Modal</h2>
        </Modal>

        <ConfirmDialog
          isOpen={showConfirm}
          message="Are you sure?"
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => setShowConfirm(false)}
        />
      </div>
    </ErrorBoundary>
  );
};

export default DemoModule;

