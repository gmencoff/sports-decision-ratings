import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionEditor } from '@/app/create_edit/TransactionEditor';
import { Transaction, createPlayerContract } from '@/lib/data/types';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock the server actions
const mockAddTransaction = vi.fn();
const mockEditTransaction = vi.fn();
vi.mock('@/app/actions/transactions', () => ({
  addTransaction: (tx: Transaction) => mockAddTransaction(tx),
  editTransaction: (id: string, tx: Transaction) => mockEditTransaction(id, tx),
}));

describe('TransactionEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddTransaction.mockResolvedValue({ id: 'new-id' });
    mockEditTransaction.mockResolvedValue({ id: 'existing-id' });
  });

  describe('Create mode (new transactions)', () => {
    it('should call addTransaction when submitting a new Trade', async () => {
      const user = userEvent.setup();
      render(<TransactionEditor existingTransaction={null} />);

      // Trade is the default type, just submit
      const submitButton = screen.getByRole('button', { name: /trade/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalledTimes(1);
        expect(mockAddTransaction).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'trade' })
        );
      });
      expect(mockEditTransaction).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should call addTransaction when submitting a new Signing', async () => {
      const user = userEvent.setup();
      render(<TransactionEditor existingTransaction={null} />);

      // Select Signing type
      const typeSelect = screen.getByLabelText(/transaction type/i);
      await user.selectOptions(typeSelect, 'signing');

      // Fill in required fields
      await user.type(screen.getByLabelText(/player name/i), 'Patrick Mahomes');
      await user.selectOptions(screen.getByLabelText(/position/i), 'QB');
      // Enable contract fields (default is unknown) by clicking checkboxes
      await user.click(screen.getByRole('checkbox', { name: /contract years/i }));
      await user.click(screen.getByRole('checkbox', { name: /total value/i }));
      await user.click(screen.getByRole('checkbox', { name: /guaranteed/i }));
      // Fill in contract values
      await user.clear(screen.getByRole('spinbutton', { name: /contract years/i }));
      await user.type(screen.getByRole('spinbutton', { name: /contract years/i }), '5');
      await user.clear(screen.getByRole('spinbutton', { name: /total value/i }));
      await user.type(screen.getByRole('spinbutton', { name: /total value/i }), '50000000');
      await user.clear(screen.getByRole('spinbutton', { name: /guaranteed/i }));
      await user.type(screen.getByRole('spinbutton', { name: /guaranteed/i }), '40000000');

      const submitButton = screen.getByRole('button', { name: /signing/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalledTimes(1);
        expect(mockAddTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'signing',
            player: { name: 'Patrick Mahomes', position: 'QB' },
            contract: { years: 5, totalValue: 50000000, guaranteed: 40000000 },
          })
        );
      });
      expect(mockEditTransaction).not.toHaveBeenCalled();
    });

    it('should call addTransaction when submitting a new Draft', async () => {
      const user = userEvent.setup();
      render(<TransactionEditor existingTransaction={null} />);

      // Select Draft type
      const typeSelect = screen.getByLabelText(/transaction type/i);
      await user.selectOptions(typeSelect, 'draft');

      // Fill in required fields
      await user.type(screen.getByLabelText(/player name/i), 'Caleb Williams');
      await user.selectOptions(screen.getByLabelText(/position/i), 'QB');
      await user.clear(screen.getByLabelText(/round/i));
      await user.type(screen.getByLabelText(/round/i), '1');
      await user.clear(screen.getByLabelText(/pick/i));
      await user.type(screen.getByLabelText(/pick/i), '1');

      const submitButton = screen.getByRole('button', { name: /draft/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalledTimes(1);
        expect(mockAddTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'draft',
            player: { name: 'Caleb Williams', position: 'QB' },
            draftPick: expect.objectContaining({
              round: 1,
              number: 1,
            }),
          })
        );
      });
      expect(mockEditTransaction).not.toHaveBeenCalled();
    });

    it('should call addTransaction when submitting a new Release', async () => {
      const user = userEvent.setup();
      render(<TransactionEditor existingTransaction={null} />);

      // Select Release type
      const typeSelect = screen.getByLabelText(/transaction type/i);
      await user.selectOptions(typeSelect, 'release');

      // Fill in required fields
      await user.type(screen.getByLabelText(/player name/i), 'Jimmy Garoppolo');
      await user.selectOptions(screen.getByLabelText(/position/i), 'QB');
      await user.clear(screen.getByLabelText(/cap savings/i));
      await user.type(screen.getByLabelText(/cap savings/i), '11000000');

      const submitButton = screen.getByRole('button', { name: /release/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalledTimes(1);
        expect(mockAddTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'release',
            player: { name: 'Jimmy Garoppolo', position: 'QB' },
            capSavings: 11000000,
          })
        );
      });
      expect(mockEditTransaction).not.toHaveBeenCalled();
    });

    it('should call addTransaction when submitting a new Extension', async () => {
      const user = userEvent.setup();
      render(<TransactionEditor existingTransaction={null} />);

      // Select Extension type
      const typeSelect = screen.getByLabelText(/transaction type/i);
      await user.selectOptions(typeSelect, 'extension');

      // Fill in required fields
      await user.type(screen.getByLabelText(/player name/i), 'Travis Kelce');
      await user.selectOptions(screen.getByLabelText(/position/i), 'TE');
      // Enable contract fields (default is unknown) by clicking checkboxes
      await user.click(screen.getByRole('checkbox', { name: /contract years/i }));
      await user.click(screen.getByRole('checkbox', { name: /total value/i }));
      await user.click(screen.getByRole('checkbox', { name: /guaranteed/i }));
      // Fill in contract values
      await user.clear(screen.getByRole('spinbutton', { name: /contract years/i }));
      await user.type(screen.getByRole('spinbutton', { name: /contract years/i }), '2');
      await user.clear(screen.getByRole('spinbutton', { name: /total value/i }));
      await user.type(screen.getByRole('spinbutton', { name: /total value/i }), '34000000');
      await user.clear(screen.getByRole('spinbutton', { name: /guaranteed/i }));
      await user.type(screen.getByRole('spinbutton', { name: /guaranteed/i }), '20000000');

      const submitButton = screen.getByRole('button', { name: /extension/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalledTimes(1);
        expect(mockAddTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'extension',
            subtype: 'player',
            player: { name: 'Travis Kelce', position: 'TE' },
            contract: { years: 2, totalValue: 34000000, guaranteed: 20000000 },
          })
        );
      });
      expect(mockEditTransaction).not.toHaveBeenCalled();
    });

    it('should call addTransaction when submitting a new Hire', async () => {
      const user = userEvent.setup();
      render(<TransactionEditor existingTransaction={null} />);

      // Select Hire type
      const typeSelect = screen.getByLabelText(/transaction type/i);
      await user.selectOptions(typeSelect, 'hire');

      // Fill in required fields
      await user.type(screen.getByLabelText(/staff name/i), 'Ben Johnson');
      await user.selectOptions(screen.getByLabelText(/role/i), 'Head Coach');

      const submitButton = screen.getByRole('button', { name: /hire/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalledTimes(1);
        expect(mockAddTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'hire',
            staff: { name: 'Ben Johnson', role: 'Head Coach' },
          })
        );
      });
      expect(mockEditTransaction).not.toHaveBeenCalled();
    });

    it('should call addTransaction when submitting a new Fire', async () => {
      const user = userEvent.setup();
      render(<TransactionEditor existingTransaction={null} />);

      // Select Fire type
      const typeSelect = screen.getByLabelText(/transaction type/i);
      await user.selectOptions(typeSelect, 'fire');

      // Fill in required fields
      await user.type(screen.getByLabelText(/staff name/i), 'Mike McCarthy');
      await user.selectOptions(screen.getByLabelText(/role/i), 'Head Coach');

      const submitButton = screen.getByRole('button', { name: /fire/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalledTimes(1);
        expect(mockAddTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'fire',
            staff: { name: 'Mike McCarthy', role: 'Head Coach' },
          })
        );
      });
      expect(mockEditTransaction).not.toHaveBeenCalled();
    });
  });

  describe('Edit mode (existing transactions)', () => {
    it('should call editTransaction when updating an existing Signing', async () => {
      const user = userEvent.setup();
      const existingTransaction: Transaction = {
        id: 'tx-123',
        type: 'signing',
        teamIds: ['KC'],
        timestamp: new Date('2025-01-01'),
        player: { name: 'Old Player', position: 'WR' },
        contract: createPlayerContract(2, 20000000, 10000000),
      };

      render(<TransactionEditor existingTransaction={existingTransaction} />);

      // Type selector should not be shown in edit mode
      expect(screen.queryByLabelText(/transaction type/i)).not.toBeInTheDocument();
      expect(screen.getByText(/editing: signing/i)).toBeInTheDocument();

      // Update a field
      const playerNameInput = screen.getByLabelText(/player name/i);
      await user.clear(playerNameInput);
      await user.type(playerNameInput, 'New Player');

      const submitButton = screen.getByRole('button', { name: /update signing/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockEditTransaction).toHaveBeenCalledTimes(1);
        expect(mockEditTransaction).toHaveBeenCalledWith(
          'tx-123',
          expect.objectContaining({
            type: 'signing',
            player: expect.objectContaining({ name: 'New Player' }),
          })
        );
      });
      expect(mockAddTransaction).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should call editTransaction when updating an existing Fire', async () => {
      const user = userEvent.setup();
      const existingTransaction: Transaction = {
        id: 'tx-456',
        type: 'fire',
        teamIds: ['DAL'],
        timestamp: new Date('2025-01-01'),
        staff: { name: 'Old Coach', role: 'Offensive Coordinator' },
      };

      render(<TransactionEditor existingTransaction={existingTransaction} />);

      // Update the role
      await user.selectOptions(screen.getByLabelText(/role/i), 'Head Coach');

      const submitButton = screen.getByRole('button', { name: /update fire/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockEditTransaction).toHaveBeenCalledTimes(1);
        expect(mockEditTransaction).toHaveBeenCalledWith(
          'tx-456',
          expect.objectContaining({
            type: 'fire',
            staff: { name: 'Old Coach', role: 'Head Coach' },
          })
        );
      });
      expect(mockAddTransaction).not.toHaveBeenCalled();
    });

    it('should call editTransaction when updating an existing Draft', async () => {
      const user = userEvent.setup();
      const existingTransaction: Transaction = {
        id: 'tx-789',
        type: 'draft',
        teamIds: ['CHI'],
        timestamp: new Date('2025-01-01'),
        player: { name: 'Draft Pick', position: 'QB' },
        draftPick: { ogTeamId: 'CHI', year: 2025, round: 1, number: 1 },
      };

      render(<TransactionEditor existingTransaction={existingTransaction} />);

      // Update the pick number
      const pickInput = screen.getByLabelText(/pick/i);
      await user.clear(pickInput);
      await user.type(pickInput, '2');

      const submitButton = screen.getByRole('button', { name: /update draft/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockEditTransaction).toHaveBeenCalledTimes(1);
        expect(mockEditTransaction).toHaveBeenCalledWith(
          'tx-789',
          expect.objectContaining({
            type: 'draft',
            draftPick: expect.objectContaining({ number: 2 }),
          })
        );
      });
      expect(mockAddTransaction).not.toHaveBeenCalled();
    });
  });

  describe('Transaction date selection', () => {
    it('should default the date field to today', () => {
      render(<TransactionEditor existingTransaction={null} />);
      const dateInput = screen.getByLabelText(/transaction date/i);
      const today = new Date();
      const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      expect(dateInput).toHaveValue(expected);
    });

    it('should submit with a past date when changed', async () => {
      const user = userEvent.setup();
      render(<TransactionEditor existingTransaction={null} />);

      // Change to a past date
      const dateInput = screen.getByLabelText(/transaction date/i);
      await user.clear(dateInput);
      await user.type(dateInput, '2025-01-15');

      const submitButton = screen.getByRole('button', { name: /trade/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddTransaction).toHaveBeenCalledTimes(1);
        const submittedTransaction = mockAddTransaction.mock.calls[0][0];
        expect(submittedTransaction.timestamp.getFullYear()).toBe(2025);
        expect(submittedTransaction.timestamp.getMonth()).toBe(0); // January
        expect(submittedTransaction.timestamp.getDate()).toBe(15);
      });
    });

    it('should show existing date when editing a transaction', () => {
      const existingTransaction: Transaction = {
        id: 'tx-date',
        type: 'fire',
        teamIds: ['DAL'],
        timestamp: new Date(2024, 5, 20), // June 20, 2024
        staff: { name: 'Coach', role: 'Head Coach' },
      };

      render(<TransactionEditor existingTransaction={existingTransaction} />);

      const dateInput = screen.getByLabelText(/transaction date/i);
      expect(dateInput).toHaveValue('2024-06-20');
    });
  });

  describe('Error handling', () => {
    it('should display error message when addTransaction fails', async () => {
      const user = userEvent.setup();
      mockAddTransaction.mockRejectedValue(new Error('Failed to add transaction'));

      render(<TransactionEditor existingTransaction={null} />);

      const submitButton = screen.getByRole('button', { name: /trade/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to add transaction/i)).toBeInTheDocument();
      });
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should display error message when editTransaction fails', async () => {
      const user = userEvent.setup();
      mockEditTransaction.mockRejectedValue(new Error('Failed to update'));

      const existingTransaction: Transaction = {
        id: 'tx-123',
        type: 'hire',
        teamIds: [],
        timestamp: new Date(),
        staff: { name: 'Coach', role: 'Head Coach' },
        contract: {},
      };

      render(<TransactionEditor existingTransaction={existingTransaction} />);

      const submitButton = screen.getByRole('button', { name: /update hire/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to update/i)).toBeInTheDocument();
      });
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
