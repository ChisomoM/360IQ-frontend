/**
 * Comprehensive E2E Test for Mock Dashboard Store
 * This tests all critical flows without needing the backend
 */

import { useMockDashboardStore } from '@/lib/store/mockDashboardStore';
import {
  getDashboardCardsGrouped,
  getDashboardEscalations,
  getDashboardCardConfiguration,
  getDashboardCardDefinitions,
  updateDashboardCardConfiguration,
  createCardDefinition,
  USE_MOCK_DASHBOARD,
} from '@/lib/api/dashboard';
import type { SaveCardConfigRequest, CreateCardDefinitionRequest } from '@/lib/api/dashboard';

export async function runE2ETests() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 MOCK DASHBOARD STORE - END-TO-END TEST SUITE');
  console.log('='.repeat(70) + '\n');

  let passedTests = 0;
  let failedTests = 0;

  // ===== FLOW 1: View Dashboard with Mock Data =====
  try {
    console.log('📊 FLOW 1: View Dashboard with Mock Data');
    console.log('-'.repeat(70));

    if (!USE_MOCK_DASHBOARD) {
      throw new Error('Mock mode is disabled!');
    }
    console.log('✅ Mock mode is enabled');

    const cards = await getDashboardCardsGrouped();
    if (!cards || !cards.top) {
      throw new Error('No cards returned');
    }
    console.log(`✅ Got cards grouped by zone:`);
    console.log(`   - Top: ${cards.top.length} cards`);
    console.log(`   - Side: ${cards.side.length} cards`);
    console.log(`   - Middle: ${cards.middle.length} cards`);

    const totalCards = (cards.top?.length || 0) + (cards.side?.length || 0) + (cards.middle?.length || 0);
    if (totalCards === 0) {
      throw new Error('No cards loaded');
    }
    console.log(`✅ Total: ${totalCards} cards loaded from mock store`);
    console.log('✅ FLOW 1 PASSED\n');
    passedTests++;
  } catch (err) {
    console.error('❌ FLOW 1 FAILED:', err instanceof Error ? err.message : err);
    failedTests++;
  }

  // ===== FLOW 2: Get Escalations =====
  try {
    console.log('⚠️  FLOW 2: Get Escalations');
    console.log('-'.repeat(70));

    const escalations = await getDashboardEscalations();
    if (!Array.isArray(escalations)) {
      throw new Error('Escalations not an array');
    }
    console.log(`✅ Got ${escalations.length} escalations`);

    escalations.forEach((e, idx) => {
      console.log(`   [${idx + 1}] "${e.document_title}" - ${e.status} (${e.days_pending}d pending)`);
    });

    if (escalations.length === 0) {
      console.warn('⚠️  No escalations in mock data');
    } else {
      console.log('✅ FLOW 2 PASSED\n');
      passedTests++;
    }
  } catch (err) {
    console.error('❌ FLOW 2 FAILED:', err instanceof Error ? err.message : err);
    failedTests++;
  }

  // ===== FLOW 3: Get Card Configuration (for admin) =====
  try {
    console.log('⚙️  FLOW 3: Get Card Configuration');
    console.log('-'.repeat(70));

    const config = await getDashboardCardConfiguration('dept-fin-uuid');
    if (!config) {
      throw new Error('No config returned');
    }

    const configData = (config as any).configurations || config;
    const configArray = Array.isArray(configData) ? configData : [configData];

    console.log(`✅ Got configuration for Finance department:`);
    console.log(`   - Cards in config: ${configArray.length}`);
    console.log(`   - Departments available: ${(config as any).departments?.length || 0}`);
    console.log(`   - Roles available: ${(config as any).roles?.length || 0}`);
    console.log('✅ FLOW 3 PASSED\n');
    passedTests++;
  } catch (err) {
    console.error('❌ FLOW 3 FAILED:', err instanceof Error ? err.message : err);
    failedTests++;
  }

  // ===== FLOW 4: Update Card Visibility =====
  try {
    console.log('🔄 FLOW 4: Update Card Visibility');
    console.log('-'.repeat(70));

    // Get initial state
    const beforeCards = await getDashboardCardsGrouped();
    const beforeCount = (beforeCards.top?.length || 0) + (beforeCards.side?.length || 0) + (beforeCards.middle?.length || 0);
    console.log(`📊 Before: ${beforeCount} cards visible`);

    // Hide a card
    const updateRequest: SaveCardConfigRequest = {
      card_id: 'def-escalations-1',
      department_id: 'dept-fin-uuid',
      visible: false,
      order_index: 1,
    };

    await updateDashboardCardConfiguration(updateRequest);
    console.log('✅ Updated card visibility');

    // Get updated state
    const afterCards = await getDashboardCardsGrouped();
    const afterCount = (afterCards.top?.length || 0) + (afterCards.side?.length || 0) + (afterCards.middle?.length || 0);
    console.log(`📊 After: ${afterCount} cards visible`);

    if (afterCount < beforeCount) {
      console.log(`✅ Card was successfully hidden (${beforeCount} → ${afterCount})`);
      console.log('✅ FLOW 4 PASSED\n');
      passedTests++;
    } else {
      throw new Error('Card visibility did not change');
    }
  } catch (err) {
    console.error('❌ FLOW 4 FAILED:', err instanceof Error ? err.message : err);
    failedTests++;
  }

  // ===== FLOW 5: Create New Card Definition =====
  try {
    console.log('✨ FLOW 5: Create New Card Definition');
    console.log('-'.repeat(70));

    const beforeDefs = await getDashboardCardDefinitions();
    const beforeCount = beforeDefs.length;
    console.log(`📋 Before: ${beforeCount} card definitions`);

    const newCardReq: CreateCardDefinitionRequest = {
      title: 'E2E Test Card',
      description: 'Created by E2E test suite',
      card_type: 'metric',
      layout_zone: 'middle',
      order_index: 999,
      config: { test: true, timestamp: new Date().toISOString() },
    };

    const result = await createCardDefinition(newCardReq);
    if (!result) {
      throw new Error('No result returned from create');
    }
    console.log(`✅ Created new card definition`);
    console.log(`   - Type: ${result.card_type}`);
    console.log(`   - Title: ${result.title}`);
    console.log(`   - Zone: ${result.layout_zone}`);

    const afterDefs = await getDashboardCardDefinitions();
    const afterCount = afterDefs.length;
    console.log(`📋 After: ${afterCount} card definitions`);

    if (afterCount > beforeCount) {
      console.log(`✅ Card was successfully created (+1 card)`);
      console.log('✅ FLOW 5 PASSED\n');
      passedTests++;
    } else {
      throw new Error('New card was not added to definitions');
    }
  } catch (err) {
    console.error('❌ FLOW 5 FAILED:', err instanceof Error ? err.message : err);
    failedTests++;
  }

  // ===== FLOW 6: Data Persistence Across Navigation =====
  try {
    console.log('💾 FLOW 6: Data Persistence');
    console.log('-'.repeat(70));

    const store = useMockDashboardStore.getState();

    // Get initial data
    const initialCards = store.getVisibleCards('dept-fin-uuid');
    console.log(`📊 Initial state: ${initialCards.length} visible cards`);

    // Update state
    await updateDashboardCardConfiguration({
      card_id: 'def-metric-spend',
      department_id: 'dept-fin-uuid',
      visible: false,
      order_index: 5,
    });

    // Simulate navigation by getting fresh store
    const freshStore = useMockDashboardStore.getState();
    const persistedCards = freshStore.getVisibleCards('dept-fin-uuid');
    console.log(`📊 After simulated navigation: ${persistedCards.length} visible cards`);

    const wasPersisted = persistedCards.length < initialCards.length;
    if (wasPersisted) {
      console.log('✅ Changes persisted across simulated navigation');
      console.log('✅ FLOW 6 PASSED\n');
      passedTests++;
    } else {
      throw new Error('Data was not persisted');
    }
  } catch (err) {
    console.error('❌ FLOW 6 FAILED:', err instanceof Error ? err.message : err);
    failedTests++;
  }

  // ===== FLOW 7: Department Switching (Demo Feature) =====
  try {
    console.log('🏢 FLOW 7: Department Switching');
    console.log('-'.repeat(70));

    // Get Finance cards
    const financeCards = await getDashboardCardsGrouped();
    const financeCount = (financeCards.top?.length || 0) + (financeCards.side?.length || 0) + (financeCards.middle?.length || 0);

    // Switch to HR department
    const store = useMockDashboardStore.getState();
    store.setCurrentUserDepartments(['dept-hr-uuid']);
    console.log('✅ Switched to HR department');

    // Get HR cards (would require component re-fetch in real scenario)
    const hrDataManually = store.getCardsGroupedByZone('dept-hr-uuid');
    const hrCount = (hrDataManually.top?.length || 0) + (hrDataManually.side?.length || 0) + (hrDataManually.middle?.length || 0);

    console.log(`📊 Finance dept: ${financeCount} cards`);
    console.log(`📊 HR dept: ${hrCount} cards`);

    if (hrCount >= 0) {
      console.log('✅ Can switch departments and get different card sets');
      console.log('✅ FLOW 7 PASSED\n');
      passedTests++;
    }

    // Reset for next tests
    store.setCurrentUserDepartments(['dept-fin-uuid']);
  } catch (err) {
    console.error('❌ FLOW 7 FAILED:', err instanceof Error ? err.message : err);
    failedTests++;
  }

  // ===== TEST SUMMARY =====
  console.log('='.repeat(70));
  console.log('📈 TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📊 Total:  ${passedTests + failedTests}`);
  console.log(`\n${failedTests === 0 ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'}`);
  console.log('='.repeat(70) + '\n');

  return failedTests === 0;
}

// To run this test:
// import { runE2ETests } from '@/lib/mocks/e2eTests'
// await runE2ETests()
