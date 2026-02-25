/**
 * portfolioReducer — state management for the Portfolio page.
 *
 * Consolidates all local UI state that was previously spread across 10
 * individual useState calls in PortfolioContent:
 *
 *   modal      — add/edit asset modal
 *   addingOnChain — on-chain import confirmation flow
 *   syncWarning   — transient local warning message
 *
 * Action types are plain string constants exported for use in
 * the component and in tests.
 */

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export const initialPortfolioState = {
  modal: {
    isOpen: false,
    isEditing: null,    // asset ID when editing, null when adding
    selectedCoin: 'bitcoin',
    amount: '',
    buyPrice: '',
    isSaving: false,
  },
  addingOnChain: {
    token: null,        // { coinId, symbol, name, amount } | null
    isLooking: null,    // token.id being looked up, null when idle
  },
  syncWarning: '',
};

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export const PORTFOLIO_ACTIONS = {
  // Modal — open for a new add
  OPEN_MODAL: 'OPEN_MODAL',
  // Modal — open pre-filled for edit
  OPEN_MODAL_EDIT: 'OPEN_MODAL_EDIT',
  // Modal — close and reset form fields
  CLOSE_MODAL: 'CLOSE_MODAL',
  // Modal — update a single form field (coin | amount | buyPrice)
  SET_FORM_FIELD: 'SET_FORM_FIELD',
  // Modal — mark save in progress
  SAVE_START: 'SAVE_START',
  // Modal — mark save finished (success or error)
  SAVE_END: 'SAVE_END',

  // On-chain import — begin CoinGecko lookup for a token
  ONCHAIN_LOOKUP_START: 'ONCHAIN_LOOKUP_START',
  // On-chain import — lookup finished, store resolved token data
  ONCHAIN_LOOKUP_END: 'ONCHAIN_LOOKUP_END',
  // On-chain import — user cancelled or save completed
  ONCHAIN_CLEAR: 'ONCHAIN_CLEAR',

  // Warning message — set or clear
  SET_SYNC_WARNING: 'SET_SYNC_WARNING',
  CLEAR_SYNC_WARNING: 'CLEAR_SYNC_WARNING',
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

/**
 * portfolioReducer
 *
 * @param {typeof initialPortfolioState} state
 * @param {{ type: string, payload?: unknown }} action
 * @returns {typeof initialPortfolioState}
 */
export function portfolioReducer(state, action) {
  switch (action.type) {
    // ── Modal ───────────────────────────────────────────────────────────────
    case PORTFOLIO_ACTIONS.OPEN_MODAL:
      return {
        ...state,
        modal: {
          isOpen: true,
          isEditing: null,
          selectedCoin: 'bitcoin',
          amount: '',
          buyPrice: '',
          isSaving: false,
        },
      };

    case PORTFOLIO_ACTIONS.OPEN_MODAL_EDIT: {
      const { assetId, coinId, amount, buyPrice } = action.payload;
      return {
        ...state,
        modal: {
          isOpen: true,
          isEditing: assetId,
          selectedCoin: coinId,
          amount: String(amount),
          buyPrice: String(buyPrice),
          isSaving: false,
        },
      };
    }

    case PORTFOLIO_ACTIONS.CLOSE_MODAL:
      return {
        ...state,
        modal: {
          ...initialPortfolioState.modal,
          isOpen: false,
        },
      };

    case PORTFOLIO_ACTIONS.SET_FORM_FIELD:
      return {
        ...state,
        modal: {
          ...state.modal,
          [action.payload.field]: action.payload.value,
        },
      };

    case PORTFOLIO_ACTIONS.SAVE_START:
      return {
        ...state,
        modal: { ...state.modal, isSaving: true },
      };

    case PORTFOLIO_ACTIONS.SAVE_END:
      return {
        ...state,
        modal: { ...state.modal, isSaving: false },
      };

    // ── On-chain import ─────────────────────────────────────────────────────
    case PORTFOLIO_ACTIONS.ONCHAIN_LOOKUP_START:
      return {
        ...state,
        addingOnChain: {
          token: null,
          isLooking: action.payload.tokenId,
        },
      };

    case PORTFOLIO_ACTIONS.ONCHAIN_LOOKUP_END:
      return {
        ...state,
        addingOnChain: {
          token: action.payload.token,
          isLooking: null,
        },
      };

    case PORTFOLIO_ACTIONS.ONCHAIN_CLEAR:
      return {
        ...state,
        addingOnChain: initialPortfolioState.addingOnChain,
      };

    // ── Sync warning ────────────────────────────────────────────────────────
    case PORTFOLIO_ACTIONS.SET_SYNC_WARNING:
      return { ...state, syncWarning: action.payload };

    case PORTFOLIO_ACTIONS.CLEAR_SYNC_WARNING:
      return { ...state, syncWarning: '' };

    default:
      return state;
  }
}
