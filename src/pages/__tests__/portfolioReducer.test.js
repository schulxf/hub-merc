/**
 * Unit tests for portfolioReducer.
 *
 * These tests verify all action types produce the correct state transitions
 * without touching any React components, Firebase, or the DOM.
 */
import {
  portfolioReducer,
  initialPortfolioState,
  PORTFOLIO_ACTIONS,
} from '../portfolioReducer';

describe('portfolioReducer', () => {
  // ─── helpers ─────────────────────────────────────────────────────────────

  function reduce(state, action) {
    return portfolioReducer(state, action);
  }

  // ─── initial state ────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('has modal closed by default', () => {
      expect(initialPortfolioState.modal.isOpen).toBe(false);
    });

    it('has no on-chain token by default', () => {
      expect(initialPortfolioState.addingOnChain.token).toBeNull();
      expect(initialPortfolioState.addingOnChain.isLooking).toBeNull();
    });

    it('has empty sync warning by default', () => {
      expect(initialPortfolioState.syncWarning).toBe('');
    });
  });

  // ─── OPEN_MODAL ───────────────────────────────────────────────────────────

  describe('OPEN_MODAL', () => {
    it('opens the modal for a new asset', () => {
      const next = reduce(initialPortfolioState, { type: PORTFOLIO_ACTIONS.OPEN_MODAL });
      expect(next.modal.isOpen).toBe(true);
      expect(next.modal.isEditing).toBeNull();
      expect(next.modal.selectedCoin).toBe('bitcoin');
      expect(next.modal.amount).toBe('');
      expect(next.modal.buyPrice).toBe('');
    });

    it('resets form fields when opening fresh modal', () => {
      const dirtyState = {
        ...initialPortfolioState,
        modal: {
          isOpen: false,
          isEditing: 'some-id',
          selectedCoin: 'ethereum',
          amount: '2.5',
          buyPrice: '3000',
          isSaving: false,
        },
      };
      const next = reduce(dirtyState, { type: PORTFOLIO_ACTIONS.OPEN_MODAL });
      expect(next.modal.isEditing).toBeNull();
      expect(next.modal.selectedCoin).toBe('bitcoin');
      expect(next.modal.amount).toBe('');
    });
  });

  // ─── OPEN_MODAL_EDIT ──────────────────────────────────────────────────────

  describe('OPEN_MODAL_EDIT', () => {
    const payload = {
      assetId: 'ethereum',
      coinId: 'ethereum',
      amount: 1.5,
      buyPrice: 3200,
    };

    it('opens the modal with pre-filled asset data', () => {
      const next = reduce(initialPortfolioState, {
        type: PORTFOLIO_ACTIONS.OPEN_MODAL_EDIT,
        payload,
      });

      expect(next.modal.isOpen).toBe(true);
      expect(next.modal.isEditing).toBe('ethereum');
      expect(next.modal.selectedCoin).toBe('ethereum');
      expect(next.modal.amount).toBe('1.5');
      expect(next.modal.buyPrice).toBe('3200');
    });
  });

  // ─── CLOSE_MODAL ─────────────────────────────────────────────────────────

  describe('CLOSE_MODAL', () => {
    it('closes the modal and resets form', () => {
      const openState = {
        ...initialPortfolioState,
        modal: {
          isOpen: true,
          isEditing: 'bitcoin',
          selectedCoin: 'bitcoin',
          amount: '0.5',
          buyPrice: '50000',
          isSaving: false,
        },
      };

      const next = reduce(openState, { type: PORTFOLIO_ACTIONS.CLOSE_MODAL });
      expect(next.modal.isOpen).toBe(false);
      expect(next.modal.amount).toBe('');
      expect(next.modal.buyPrice).toBe('');
    });
  });

  // ─── SET_FORM_FIELD ───────────────────────────────────────────────────────

  describe('SET_FORM_FIELD', () => {
    it('updates amount field', () => {
      const next = reduce(initialPortfolioState, {
        type: PORTFOLIO_ACTIONS.SET_FORM_FIELD,
        payload: { field: 'amount', value: '2.0' },
      });
      expect(next.modal.amount).toBe('2.0');
    });

    it('updates buyPrice field', () => {
      const next = reduce(initialPortfolioState, {
        type: PORTFOLIO_ACTIONS.SET_FORM_FIELD,
        payload: { field: 'buyPrice', value: '70000' },
      });
      expect(next.modal.buyPrice).toBe('70000');
    });

    it('updates selectedCoin field', () => {
      const next = reduce(initialPortfolioState, {
        type: PORTFOLIO_ACTIONS.SET_FORM_FIELD,
        payload: { field: 'selectedCoin', value: 'solana' },
      });
      expect(next.modal.selectedCoin).toBe('solana');
    });

    it('does not mutate other modal fields', () => {
      const prev = {
        ...initialPortfolioState,
        modal: { ...initialPortfolioState.modal, buyPrice: '1000' },
      };
      const next = reduce(prev, {
        type: PORTFOLIO_ACTIONS.SET_FORM_FIELD,
        payload: { field: 'amount', value: '5' },
      });
      expect(next.modal.buyPrice).toBe('1000');
    });
  });

  // ─── SAVE_START / SAVE_END ────────────────────────────────────────────────

  describe('SAVE_START / SAVE_END', () => {
    it('marks isSaving true on SAVE_START', () => {
      const next = reduce(initialPortfolioState, { type: PORTFOLIO_ACTIONS.SAVE_START });
      expect(next.modal.isSaving).toBe(true);
    });

    it('marks isSaving false on SAVE_END', () => {
      const savingState = {
        ...initialPortfolioState,
        modal: { ...initialPortfolioState.modal, isSaving: true },
      };
      const next = reduce(savingState, { type: PORTFOLIO_ACTIONS.SAVE_END });
      expect(next.modal.isSaving).toBe(false);
    });
  });

  // ─── ON-CHAIN import ──────────────────────────────────────────────────────

  describe('ONCHAIN_LOOKUP_START', () => {
    it('sets isLooking to the token id', () => {
      const next = reduce(initialPortfolioState, {
        type: PORTFOLIO_ACTIONS.ONCHAIN_LOOKUP_START,
        payload: { tokenId: 'abc123' },
      });
      expect(next.addingOnChain.isLooking).toBe('abc123');
      expect(next.addingOnChain.token).toBeNull();
    });
  });

  describe('ONCHAIN_LOOKUP_END', () => {
    it('stores the resolved token and clears isLooking', () => {
      const lookingState = {
        ...initialPortfolioState,
        addingOnChain: { token: null, isLooking: 'abc123' },
      };
      const resolvedToken = { coinId: 'ethereum', symbol: 'ETH', name: 'Ethereum', amount: 0.5 };
      const next = reduce(lookingState, {
        type: PORTFOLIO_ACTIONS.ONCHAIN_LOOKUP_END,
        payload: { token: resolvedToken },
      });
      expect(next.addingOnChain.token).toEqual(resolvedToken);
      expect(next.addingOnChain.isLooking).toBeNull();
    });
  });

  describe('ONCHAIN_CLEAR', () => {
    it('resets addingOnChain to initial state', () => {
      const withToken = {
        ...initialPortfolioState,
        addingOnChain: {
          token: { coinId: 'eth', symbol: 'ETH', name: 'Ethereum', amount: 1 },
          isLooking: null,
        },
      };
      const next = reduce(withToken, { type: PORTFOLIO_ACTIONS.ONCHAIN_CLEAR });
      expect(next.addingOnChain.token).toBeNull();
      expect(next.addingOnChain.isLooking).toBeNull();
    });
  });

  // ─── SYNC_WARNING ─────────────────────────────────────────────────────────

  describe('SET_SYNC_WARNING / CLEAR_SYNC_WARNING', () => {
    it('sets the warning message', () => {
      const next = reduce(initialPortfolioState, {
        type: PORTFOLIO_ACTIONS.SET_SYNC_WARNING,
        payload: 'Erro de sincronia',
      });
      expect(next.syncWarning).toBe('Erro de sincronia');
    });

    it('clears the warning message', () => {
      const withWarning = { ...initialPortfolioState, syncWarning: 'Erro de sincronia' };
      const next = reduce(withWarning, { type: PORTFOLIO_ACTIONS.CLEAR_SYNC_WARNING });
      expect(next.syncWarning).toBe('');
    });
  });

  // ─── unknown action ───────────────────────────────────────────────────────

  describe('unknown action type', () => {
    it('returns current state unchanged', () => {
      const next = reduce(initialPortfolioState, { type: 'DOES_NOT_EXIST' });
      expect(next).toBe(initialPortfolioState);
    });
  });
});
