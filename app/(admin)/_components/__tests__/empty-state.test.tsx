/**
 * Tests for EmptyState component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Users } from 'lucide-react'
import { EmptyState, EmptyList, EmptySearchResults, EmptyFilteredResults } from '../empty-state'

describe('EmptyState', () => {
  it('should render title', () => {
    render(<EmptyState title="No items found" />)
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('should render description when provided', () => {
    render(
      <EmptyState 
        title="No items found" 
        description="Try creating your first item"
      />
    )
    expect(screen.getByText('Try creating your first item')).toBeInTheDocument()
  })

  it('should render icon when provided', () => {
    const { container } = render(
      <EmptyState 
        title="No items found" 
        icon={Users}
      />
    )
    // Check if SVG is rendered (lucide icons render as SVG)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should render action button when provided', () => {
    const handleClick = jest.fn()
    render(
      <EmptyState 
        title="No items found" 
        action={{
          label: 'Create Item',
          onClick: handleClick,
        }}
      />
    )
    
    const button = screen.getByRole('button', { name: 'Create Item' })
    expect(button).toBeInTheDocument()
    
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should render secondary action button when provided', () => {
    const handlePrimary = jest.fn()
    const handleSecondary = jest.fn()
    
    render(
      <EmptyState 
        title="No items found" 
        action={{
          label: 'Create Item',
          onClick: handlePrimary,
        }}
        secondaryAction={{
          label: 'Import Items',
          onClick: handleSecondary,
        }}
      />
    )
    
    const primaryButton = screen.getByRole('button', { name: 'Create Item' })
    const secondaryButton = screen.getByRole('button', { name: 'Import Items' })
    
    expect(primaryButton).toBeInTheDocument()
    expect(secondaryButton).toBeInTheDocument()
    
    fireEvent.click(primaryButton)
    expect(handlePrimary).toHaveBeenCalledTimes(1)
    
    fireEvent.click(secondaryButton)
    expect(handleSecondary).toHaveBeenCalledTimes(1)
  })

  it('should render compact version', () => {
    const { container } = render(
      <EmptyState 
        title="No items found" 
        compact
      />
    )
    
    // Compact version should not have Card wrapper
    expect(container.querySelector('[class*="border-dashed"]')).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <EmptyState 
        title="No items found" 
        className="custom-class"
      />
    )
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })
})

describe('EmptyList', () => {
  it('should render with default props', () => {
    render(<EmptyList />)
    expect(screen.getByText('No items found')).toBeInTheDocument()
    expect(screen.getByText('Get started by creating your first item.')).toBeInTheDocument()
  })

  it('should render with custom props', () => {
    const handleAction = jest.fn()
    render(
      <EmptyList
        title="No users"
        description="Create your first user"
        actionLabel="Add User"
        onAction={handleAction}
      />
    )
    
    expect(screen.getByText('No users')).toBeInTheDocument()
    expect(screen.getByText('Create your first user')).toBeInTheDocument()
    
    const button = screen.getByRole('button', { name: 'Add User' })
    fireEvent.click(button)
    expect(handleAction).toHaveBeenCalledTimes(1)
  })

  it('should not render action button when onAction is not provided', () => {
    render(<EmptyList />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('EmptySearchResults', () => {
  it('should render with search term', () => {
    render(<EmptySearchResults searchTerm="test query" />)
    expect(screen.getByText('No results found')).toBeInTheDocument()
    expect(screen.getByText(/test query/)).toBeInTheDocument()
  })

  it('should render clear button when onClear is provided', () => {
    const handleClear = jest.fn()
    render(
      <EmptySearchResults 
        searchTerm="test query" 
        onClear={handleClear}
      />
    )
    
    const button = screen.getByRole('button', { name: 'Clear Search' })
    fireEvent.click(button)
    expect(handleClear).toHaveBeenCalledTimes(1)
  })

  it('should not render clear button when onClear is not provided', () => {
    render(<EmptySearchResults searchTerm="test query" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('EmptyFilteredResults', () => {
  it('should render with default message', () => {
    render(<EmptyFilteredResults />)
    expect(screen.getByText('No matching results')).toBeInTheDocument()
  })

  it('should render clear filters button when onClearFilters is provided', () => {
    const handleClear = jest.fn()
    render(<EmptyFilteredResults onClearFilters={handleClear} />)
    
    const button = screen.getByRole('button', { name: 'Clear Filters' })
    fireEvent.click(button)
    expect(handleClear).toHaveBeenCalledTimes(1)
  })

  it('should not render clear button when onClearFilters is not provided', () => {
    render(<EmptyFilteredResults />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
