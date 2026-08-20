/**
 * Tests for toast notification utilities
 */

import { toast } from '../toast'
import { toast as sonnerToast } from 'sonner'

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    loading: jest.fn(),
    promise: jest.fn(),
    dismiss: jest.fn(),
  },
}))

describe('Toast Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('success', () => {
    it('should call sonner success with message', () => {
      toast.success('Operation successful')
      
      expect(sonnerToast.success).toHaveBeenCalledWith(
        'Operation successful',
        expect.objectContaining({
          duration: 4000,
        })
      )
    })

    it('should call sonner success with description', () => {
      toast.success('Operation successful', {
        description: 'The operation completed successfully',
      })
      
      expect(sonnerToast.success).toHaveBeenCalledWith(
        'Operation successful',
        expect.objectContaining({
          description: 'The operation completed successfully',
          duration: 4000,
        })
      )
    })

    it('should call sonner success with custom duration', () => {
      toast.success('Operation successful', {
        duration: 6000,
      })
      
      expect(sonnerToast.success).toHaveBeenCalledWith(
        'Operation successful',
        expect.objectContaining({
          duration: 6000,
        })
      )
    })

    it('should call sonner success with action', () => {
      const onClick = jest.fn()
      toast.success('Operation successful', {
        action: {
          label: 'Undo',
          onClick,
        },
      })
      
      expect(sonnerToast.success).toHaveBeenCalledWith(
        'Operation successful',
        expect.objectContaining({
          action: {
            label: 'Undo',
            onClick,
          },
        })
      )
    })
  })

  describe('error', () => {
    it('should call sonner error with message', () => {
      toast.error('Operation failed')
      
      expect(sonnerToast.error).toHaveBeenCalledWith(
        'Operation failed',
        expect.objectContaining({
          duration: 5000,
        })
      )
    })

    it('should call sonner error with description', () => {
      toast.error('Operation failed', {
        description: 'An error occurred',
      })
      
      expect(sonnerToast.error).toHaveBeenCalledWith(
        'Operation failed',
        expect.objectContaining({
          description: 'An error occurred',
          duration: 5000,
        })
      )
    })
  })

  describe('info', () => {
    it('should call sonner info with message', () => {
      toast.info('Information message')
      
      expect(sonnerToast.info).toHaveBeenCalledWith(
        'Information message',
        expect.objectContaining({
          duration: 4000,
        })
      )
    })
  })

  describe('warning', () => {
    it('should call sonner warning with message', () => {
      toast.warning('Warning message')
      
      expect(sonnerToast.warning).toHaveBeenCalledWith(
        'Warning message',
        expect.objectContaining({
          duration: 4000,
        })
      )
    })
  })

  describe('loading', () => {
    it('should call sonner loading with message', () => {
      toast.loading('Loading...')
      
      expect(sonnerToast.loading).toHaveBeenCalledWith(
        'Loading...',
        expect.objectContaining({
          duration: Infinity,
        })
      )
    })
  })

  describe('promise', () => {
    it('should call sonner promise with promise and messages', () => {
      const promise = Promise.resolve('data')
      const messages = {
        loading: 'Loading...',
        success: 'Success!',
        error: 'Error!',
      }
      
      toast.promise(promise, messages)
      
      expect(sonnerToast.promise).toHaveBeenCalledWith(promise, messages)
    })
  })

  describe('dismiss', () => {
    it('should call sonner dismiss with toast id', () => {
      toast.dismiss('toast-1')
      
      expect(sonnerToast.dismiss).toHaveBeenCalledWith('toast-1')
    })

    it('should call sonner dismiss without id', () => {
      toast.dismiss()
      
      expect(sonnerToast.dismiss).toHaveBeenCalledWith(undefined)
    })
  })

  describe('dismissAll', () => {
    it('should call sonner dismiss without arguments', () => {
      toast.dismissAll()
      
      expect(sonnerToast.dismiss).toHaveBeenCalledWith()
    })
  })
})
