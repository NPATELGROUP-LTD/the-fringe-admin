'use client';

import { useState } from 'react';
import { Button } from './Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import { Select } from './Select';
import { Label } from './Label';

interface BulkOperationResult {
  total: number;
  successful: number;
  failed: number;
  errors?: Array<{ id: string; error: string }>;
}

interface BulkOperationsProps<T> {
  selectedItems: T[];
  onClearSelection: () => void;
  availableActions: BulkAction<T>[];
  onActionComplete?: (result: BulkOperationResult) => void;
}

interface BulkAction<T> {
  key: string;
  label: string;
  type: 'status' | 'category' | 'delete' | 'custom';
  options?: Array<{ value: string; label: string }>;
  handler: (items: T[], value?: string) => Promise<BulkOperationResult>;
  confirmMessage?: (count: number, value?: string) => string;
}

export function BulkOperations<T extends { id: string }>({
  selectedItems,
  onClearSelection,
  availableActions,
  onActionComplete,
}: BulkOperationsProps<T>) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState<BulkAction<T> | null>(null);
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [result, setResult] = useState<BulkOperationResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleActionClick = (action: BulkAction<T>) => {
    setCurrentAction(action);
    setSelectedValue('');
    setResult(null);
    if (action.type === 'delete' || action.confirmMessage) {
      setShowConfirm(true);
    } else {
      executeAction(action);
    }
  };

  const executeAction = async (action: BulkAction<T>) => {
    if (selectedItems.length === 0) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const operationResult = await action.handler(selectedItems, selectedValue || undefined);
      setResult(operationResult);
      onActionComplete?.(operationResult);
      if (operationResult.successful > 0) {
        onClearSelection();
      }
    } catch (error) {
      console.error('Bulk operation failed:', error);
      setResult({
        total: selectedItems.length,
        successful: 0,
        failed: selectedItems.length,
        errors: [{ id: 'general', error: 'Operation failed' }],
      });
    } finally {
      setIsProcessing(false);
      setShowConfirm(false);
    }
  };

  const handleConfirm = () => {
    if (currentAction) {
      executeAction(currentAction);
    }
  };

  const handleClose = () => {
    setCurrentAction(null);
    setSelectedValue('');
    setResult(null);
    setShowConfirm(false);
  };

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-blue-800 font-medium">
          {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected:
        </div>

        {availableActions.map((action) => (
          <div key={action.key} className="flex items-center gap-2">
            {action.type === 'status' || action.type === 'category' ? (
              <>
                <Select
                  value={selectedValue}
                  onChange={(e) => setSelectedValue(e.target.value)}
                  className="w-32"
                  disabled={isProcessing}
                >
                  <option value="">{action.label}</option>
                  {action.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick(action)}
                  disabled={!selectedValue || isProcessing}
                >
                  Apply
                </Button>
              </>
            ) : (
              <Button
                variant={action.type === 'delete' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => handleActionClick(action)}
                disabled={isProcessing}
              >
                {action.label} ({selectedItems.length})
              </Button>
            )}
          </div>
        ))}

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={isProcessing}
        >
          Clear Selection
        </Button>
      </div>

      {/* Progress Modal */}
      {(isProcessing || result) && currentAction && (
        <Modal isOpen={true} onClose={handleClose}>
          <ModalHeader>
            {isProcessing ? 'Processing...' : 'Operation Complete'}
          </ModalHeader>
          <ModalBody>
            {isProcessing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-primary">
                  {currentAction.label} {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}...
                </p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-green-600 mb-2">
                    {currentAction.label} Complete
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">{result.total}</div>
                        <div className="text-sm text-gray-600">Total</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{result.successful}</div>
                        <div className="text-sm text-gray-600">Successful</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                        <div className="text-sm text-gray-600">Failed</div>
                      </div>
                    </div>
                  </div>
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-red-600 mb-2">Errors:</h4>
                      <div className="max-h-40 overflow-y-auto bg-red-50 p-3 rounded text-sm">
                        {result.errors.map((error, index) => (
                          <div key={index} className="mb-1">
                            {error.id}: {error.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleClose}>
              {result ? 'Close' : 'Cancel'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Confirmation Modal */}
      {showConfirm && currentAction && (
        <Modal isOpen={true} onClose={() => setShowConfirm(false)}>
          <ModalHeader>Confirm Action</ModalHeader>
          <ModalBody>
            <p className="text-primary">
              {currentAction.confirmMessage
                ? currentAction.confirmMessage(selectedItems.length, selectedValue)
                : `Are you sure you want to ${currentAction.label.toLowerCase()} ${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''}?`
              }
            </p>
            {currentAction.type === 'delete' && (
              <p className="text-red-600 text-sm mt-2">This action cannot be undone.</p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant={currentAction.type === 'delete' ? 'secondary' : 'primary'}
              onClick={handleConfirm}
            >
              {currentAction.label}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
}