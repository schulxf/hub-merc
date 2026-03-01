# Admin CMS Guide - HubMercurius

**Last Updated**: February 25, 2026 (PHASE 2)
**Status**: Complete CMS system for content management

---

## 📋 Overview

The HubMercurius Admin CMS provides a complete content management system for platform administrators and assessors. Access via `/admin` → **Painel de Controle Mercurius**.

### 8 Admin Tabs

1. **Gestão de Clientes** (User Management) — Manage user accounts and tiers
2. **Permissões de Acesso** (Access Control) — Configure feature flags and permissions
3. **Agenda Global** (Calendar) — Global events (TGE, launches, deadlines)
4. **Airdrops (Guias)** (Content CMS) — Create/edit airdrop guides
5. **Pesquisa** (Research CMS) — Create research documents
6. **Estratégias** (Strategy CMS) — Create DeFi investment strategies
7. **Portfólios Modelo** (Model Portfolio CMS) — Create reference portfolios
8. **Recomendações** (Recommendations) — Create assessor recommendations

---

## 🔍 Research CMS (Pesquisa)

### Purpose
Create and manage research documents available to users based on their tier level.

### Features
- ✅ Create/edit/delete research documents
- ✅ Real-time Firestore sync (live updates across tabs)
- ✅ Category classification (DeFi, NFT, L2, Macro, Governance, Security)
- ✅ Status tracking (Draft, Published, Archived)
- ✅ Tier-based access control (who can see this research)
- ✅ Tag system for organization
- ✅ Publish date scheduling
- ✅ Author attribution (automatic)

### Workflow

1. **Click "Pesquisa" tab**
2. **Fill form**:
   - Title (max 200 chars, required)
   - Category (DeFi/NFT/L2/Macro/Governance/Security)
   - Status (Draft/Published/Archived)
   - Content (markdown supported)
   - Tags (comma-separated, optional)
   - Min Tier (Free/Pro/VIP)
   - Publish Date
3. **Click "Salvar Pesquisa"**
4. Document appears in list below within seconds

### Editing
1. Click **Editar** on any research document
2. Modify fields
3. Click **Salvar Pesquisa** to update

### Deleting
1. Click **Apagar** on any research document
2. Confirm deletion in popup

### Best Practices
- Use "Draft" status while writing, switch to "Published" when ready
- Set appropriate min tier to control audience access
- Use clear, descriptive titles
- Add tags to improve searchability
- Archive old research instead of deleting

---

## 📈 Strategy CMS (Estratégias)

### Purpose
Define DeFi investment strategies that assessors can share with clients.

### Features
- ✅ Create/edit/delete strategies
- ✅ Risk profile classification (Low/Medium/High)
- ✅ Allocation rules (coin percentages)
- ✅ Multi-coin selection
- ✅ Tier requirements
- ✅ Assessor attribution

### Workflow

1. **Click "Estratégias" tab**
2. **Fill form**:
   - Name (required)
   - Risk Profile (Low/Medium/High)
   - Status (Draft/Published)
   - Description
   - Min Tier (Pro/VIP)
3. **Add Allocations**:
   - Click "Adicionar Alocação"
   - Select coin from dropdown
   - Enter percentage (0-100%)
   - Repeat for each asset
   - **Total must equal 100%** (validation enforced)
4. **Click "Salvar Estratégia"**

### Allocation Example
```
Bitcoin:    40%
Ethereum:   30%
Solana:     20%
Polygon:    10%
            ---
Total:     100% ✓
```

### Risk Profile Guidelines
- **Low Risk**: Stablecoins + top 5 coins (BTC, ETH, SOL, ADA, MATIC)
- **Medium Risk**: Top 20 coins + emerging projects
- **High Risk**: Altcoins, new projects, yield farming positions

### Editing & Deleting
- Click **Editar** to modify strategy
- Click **Apagar** to delete
- Changes take effect immediately (real-time sync)

---

## 💼 Model Portfolio CMS (Portfólios Modelo)

### Purpose
Create reference portfolios that clients can view and import.

### Features
- ✅ Create/edit/delete model portfolios
- ✅ Target allocation percentages
- ✅ Investment range (min/max USD)
- ✅ Risk level classification
- ✅ Tier requirements
- ✅ Status tracking (Draft/Published)

### Workflow

1. **Click "Portfólios Modelo" tab**
2. **Fill form**:
   - Name (required, e.g., "Conservative Growth")
   - Description (recommended)
   - Status (Draft/Published)
   - Min/Max Investment (USD)
   - Risk Level (Low/Medium/High)
   - Min Tier (Free/Pro/VIP)
3. **Add Target Allocations**:
   - Click "Adicionar Alocação"
   - Select coin
   - Enter target percentage
   - Total must equal 100%
4. **Click "Salvar Portfólio"**

### Investment Range Validation
- Min Investment **must be** < Max Investment
- Example: Min $5,000, Max $100,000
- Error will show if range is invalid

### Example: Conservative Portfolio
```
Name:          Conservative Growth
Min/Max:       $10,000 / $500,000
Risk:          Low
Allocations:
  BTC:  35%
  ETH:  30%
  USDC: 20%
  MATIC: 10%
  APE:   5%
  Total: 100%
```

---

## 💡 Recommendations CMS (Recomendações)

### Purpose
Create and send recommendations to clients based on their portfolio or tier.

### Features
- ✅ Create/edit/delete recommendations
- ✅ Type classification (Rebalance/Add/Remove/Replace/General)
- ✅ Target by tier or specific user ID
- ✅ Status tracking (Draft/Sent/Archived)
- ✅ JSON payload support for advanced data
- ✅ Created by tracking (assessor)

### Workflow

1. **Click "Recomendações" tab**
2. **Fill form**:
   - Type (Rebalanceamento/Adicionar/Remover/Substituir/Geral)
   - Target: Choose ONE:
     - **Tier-based**: Select Free/Pro/VIP (affects all users with that tier)
     - **User-specific**: Enter user ID (affects single user only)
   - Recommendation Text (required, markdown supported)
   - Supporting Data (optional JSON)
   - Status (Draft/Sent/Archived)
3. **Click "Salvar Recomendação"**

### Target Options

#### Tier-based (Default)
- Recommendation goes to ALL users with selected tier
- Example: "Pro" → all Pro users receive this
- Use for: general advice, new opportunities

#### User-specific (Override)
- Recommendation goes to ONE specific user
- Enter their Firebase user ID
- Use for: personalized advice, specific client needs

### JSON Supporting Data
Optional field for structured data. Must be valid JSON.

Example for "Add Asset" recommendation:
```json
{
  "coins": ["bitcoin", "ethereum"],
  "targetPercentage": 15,
  "priority": "high",
  "reasoning": "High correlation with portfolio"
}
```

### Best Practices
- Keep text clear and actionable
- Use Draft status while preparing
- Change to Sent when ready to publish
- Archive old recommendations
- Include supporting data for complex recommendations

---

## 📸 Image Upload (All CMS Tabs)

### Supported Formats
- JPEG, PNG, WebP, GIF

### Size Limits
- Maximum: 10 MB
- Recommended: < 2 MB for faster uploads

### Upload Process
1. Click image upload button
2. Select file from computer
3. Preview appears immediately
4. Auto-compressed during save
5. Stored in Firebase Cloud Storage

### Optimization
- Images auto-compressed to JPEG quality 80%
- Thumbnails generated for list views (300x200px)
- Large images resized to 1200x800px max
- Reduces storage costs and improves load times

---

## 🔗 Firestore Collections

### Structure
```
firestore/
├── /research/{docId}
│   ├── title: string
│   ├── category: enum
│   ├── content: string (markdown)
│   └── minTier: enum
│
├── /strategies/{strategyId}
│   ├── name: string
│   ├── allocations: array
│   └── riskProfile: enum
│
├── /model_portfolios/{modelId}
│   ├── name: string
│   ├── targetAllocation: array
│   └── minInvestment: number
│
└── /recommendations/{recId}
    ├── type: enum
    ├── recommendationText: string
    └── targetUserId: string | null
```

---

## ⚡ Real-time Sync

All CMS tabs use **real-time Firestore listeners**:

- ✅ Changes appear instantly (no refresh needed)
- ✅ New documents visible immediately
- ✅ Deletions processed in real-time
- ✅ Multiple admins can edit simultaneously

### How It Works
1. You create/edit document
2. Data saved to Firestore
3. **onSnapshot** listener triggers
4. UI updates automatically
5. Changes propagate to all users

---

## 🛡️ Security & Permissions

### Admin-only Access
- CMS tabs only visible to users with `tier: 'admin'`
- Firestore rules enforce write restrictions
- Non-admins see 404 access denied

### Role-based Actions
- **Admins**: Full CRUD on all content
- **Assessors**: Create recommendations for own clients
- **Users**: Read-only access to published content

### Tier Access
- **Free tier users**: Access free/public research
- **Pro tier users**: Access pro + free research
- **VIP tier users**: Access all content

---

## 🐛 Troubleshooting

### Form won't save
- Check all required fields are filled (marked with *)
- Verify data validation (allocation percentages, JSON, ranges)
- Check browser console for error messages
- Refresh page and try again

### Changes don't appear
- Real-time sync active (should update within 2 seconds)
- Check Firestore rules allow your user tier
- Verify admin status in user profile

### Image won't upload
- Check file size (max 10 MB)
- Verify file format (JPEG, PNG, WebP, GIF)
- Check Cloud Storage permissions
- Try again with smaller image

### Collection empty after reloading
- Data may be loading (see spinner)
- Check internet connection
- Verify Firestore rules allow read access
- Check if documents exist in Firebase Console

---

## 📞 Support

For issues with the CMS:
1. Check Firestore rules in `firestore.rules`
2. Verify user tier is "admin"
3. Check browser console for errors
4. Review validation messages on form
5. Contact DevOps team for database issues

---

**Classification**: Internal - Admin Guide
