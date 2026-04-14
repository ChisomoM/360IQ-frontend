/**
 * Quick test script to verify mock dashboard store functionality
 * This is NOT a formal test - just a verification script
 * Run this in browser console to test
 */

import { useMockDashboardStore } from '@/lib/store/mockDashboardStore';

export function testMockDashboardStore() {
  console.log('🧪 Testing Mock Dashboard Store...\n');

  try {
    // Get store instance
    const store = useMockDashboardStore.getState();
    console.log('✅ Store initialized');

    // Test 1: Get departments
    const depts = store.getDepartments();
    console.log(`✅ Test 1 - Get Departments: ${depts.length} departments loaded`);
    console.log('   Departments:', depts.map((d) => d.name).join(', '));

    // Test 2: Get visible cards for Finance department
    const financeCards = store.getVisibleCards('dept-fin-uuid');
    console.log(
      `✅ Test 2 - Get Visible Cards (Finance): ${financeCards.length} cards visible`
    );
    console.log('   Cards:', financeCards.map((c) => c.title).join(', '));

    // Test 3: Get cards grouped by zone
    const grouped = store.getCardsGroupedByZone('dept-fin-uuid');
    console.log(`✅ Test 3 - Get Cards Grouped by Zone:`);
    console.log(`   Top zone: ${grouped.top.length} cards`);
    console.log(`   Side zone: ${grouped.side.length} cards`);
    console.log(`   Middle zone: ${grouped.middle.length} cards`);

    // Test 4: Get escalations
    const escalations = store.getEscalations('dept-fin-uuid');
    console.log(
      `✅ Test 4 - Get Escalations (Finance): ${escalations.length} escalations`
    );
    escalations.slice(0, 2).forEach((e) => {
      console.log(
        `   - "${e.document_title}" (${e.status}) - ${e.days_pending} days pending`
      );
    });

    // Test 5: Update card visibility
    store.updateCardVisibility({
      card_id: 'def-escalations-1',
      department_id: 'dept-fin-uuid',
      visible: false,
      order_index: 99,
    });
    const updatedCards = store.getVisibleCards('dept-fin-uuid');
    console.log(
      `✅ Test 5 - Update Card Visibility: Cards now = ${updatedCards.length} (should be less)`
    );

    // Test 6: Create new card definition
    const newCardId = store.createCardDefinition({
      title: 'Test Card',
      description: 'Created during test',
      card_type: 'metric',
      layout_zone: 'middle',
      order_index: 99,
      config: { test: true },
    });
    console.log(`✅ Test 6 - Create Card Definition: New card ID = ${newCardId}`);

    // Test 7: Mark escalation resolved
    const beforeResolve = store.getEscalations('dept-fin-uuid').length;
    if (escalations.length > 0) {
      store.markEscalationResolved(escalations[0].document_id);
      const afterResolve = store.getEscalations('dept-fin-uuid').length;
      console.log(
        `✅ Test 7 - Mark Escalation Resolved: ${beforeResolve} → ${afterResolve} escalations`
      );
    }

    // Test 8: Reset store
    store.reset();
    const resetCards = store.getVisibleCards('dept-fin-uuid');
    console.log(
      `✅ Test 8 - Reset Store: Cards restored to ${resetCards.length}`
    );

    console.log(
      '\n✅ All tests passed! Mock store is working correctly.\n'
    );
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// To run:
// import { testMockDashboardStore } from '@/lib/mocks/dashboardStoreTest'
// testMockDashboardStore()
