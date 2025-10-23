# Nested Routing Verification Checklist

## Pre-Deployment Verification

### 1. File Structure Verification
- [x] Created `/src/app/(tabs)/production/cutting/_layout.tsx`
- [x] Created `/src/app/(tabs)/inventory/products/_layout.tsx`
- [x] Created `/src/app/(tabs)/inventory/ppe/_layout.tsx`
- [x] Created `/src/app/(tabs)/inventory/orders/_layout.tsx`
- [x] Created `/src/app/(tabs)/painting/formulas/_layout.tsx`
- [x] Created `/src/app/(tabs)/human-resources/ppe/_layout.tsx`
- [x] Created `/src/app/(tabs)/integrations/secullum/_layout.tsx`
- [x] Created `/src/app/(tabs)/server/deployments/_layout.tsx`
- [x] Enhanced `/src/app/(tabs)/_layout.tsx` with improved active state detection
- [x] Route validator utility exists at `/src/utils/route-validator.ts`
- [x] Created test suite at `/src/__tests__/navigation/nested-routing.test.ts`
- [x] Created documentation at `/NESTED_ROUTING_FIX_SUMMARY.md`

### 2. Build Verification
Run these commands to verify the app builds correctly:

```bash
# Clean build
npm run clean

# Type check
npm run tsc

# Build for development
npm run start

# Build for production (iOS)
npm run ios --mode production

# Build for production (Android)
npm run android --mode production
```

## Manual Testing Checklist

### Test 1: Simple Nested Navigation (2 levels)
- [ ] Navigate to Production > Schedule
- [ ] Navigate to Production > Schedule > List
- [ ] Verify menu highlights "Production" and "Schedule" correctly
- [ ] Verify breadcrumbs show: Home > Production > Schedule > List
- [ ] Use back button to return to Schedule
- [ ] Verify history is maintained correctly

### Test 2: Complex Nested Navigation (3 levels)
- [ ] Navigate to Inventory > Products
- [ ] Navigate to Inventory > Products > Brands
- [ ] Navigate to Inventory > Products > Brands > List
- [ ] Verify menu highlights all parent items correctly
- [ ] Verify breadcrumbs show full hierarchy
- [ ] Select a brand to view details
- [ ] Verify route: `/(tabs)/inventory/products/brands/details/[id]`
- [ ] Verify detail page loads correctly
- [ ] Use back button to return to brands list
- [ ] Navigate to Inventory > Products > Categories
- [ ] Verify proper section switching

### Test 3: Dynamic Segment Navigation
- [ ] Navigate to Inventory > Orders > List
- [ ] Select an order
- [ ] Navigate to order details
- [ ] Verify orderId parameter is passed correctly
- [ ] Navigate to order items: `/(tabs)/inventory/orders/[orderId]/items/list`
- [ ] Verify items list loads with correct orderId
- [ ] Use back button to return to order details

### Test 4: Multi-Dynamic Segment Navigation
- [ ] Navigate to Painting > Formulas > List
- [ ] Select a formula
- [ ] Navigate to formula details
- [ ] Navigate to formula components: `/(tabs)/painting/formulas/[formulaId]/components/list`
- [ ] Verify components list loads with correct formulaId
- [ ] Use back button to navigate back

### Test 5: Cross-Section Navigation
- [ ] Start at Production > Cutting > Cutting Plan
- [ ] Navigate to Inventory > Products > Brands
- [ ] Verify Production section is no longer highlighted
- [ ] Verify Inventory section is now highlighted
- [ ] Use back button to return to Cutting Plan
- [ ] Verify Production section is highlighted again

### Test 6: Deep Nesting with Multiple Subsections
- [ ] Navigate to Inventory > PPE
- [ ] Navigate to Inventory > PPE > Deliveries
- [ ] Navigate to Inventory > PPE > Deliveries > List
- [ ] Select a delivery
- [ ] Navigate to delivery details
- [ ] Verify full path: `/(tabs)/inventory/ppe/deliveries/details/[id]`
- [ ] Verify all parent items are highlighted correctly
- [ ] Navigate to Inventory > PPE > Schedules
- [ ] Verify correct subsection switching

### Test 7: Integration Section Navigation
- [ ] Navigate to Integrations > Secullum
- [ ] Navigate to Integrations > Secullum > Calculations
- [ ] Navigate to Integrations > Secullum > Calculations > List
- [ ] Verify route resolution works correctly
- [ ] Navigate to Integrations > Secullum > Time Entries
- [ ] Navigate to Integrations > Secullum > Time Entries > List
- [ ] Select a time entry
- [ ] Navigate to time entry details
- [ ] Verify route: `/(tabs)/integrations/secullum/time-entries/details/[id]`

### Test 8: Server Section Navigation
- [ ] Navigate to Server > Deployments
- [ ] Navigate to Server > Deployments > List
- [ ] Select a deployment
- [ ] Navigate to deployment details
- [ ] Verify route: `/(tabs)/server/deployments/details/[id]`
- [ ] Verify detail page loads correctly

### Test 9: Human Resources PPE Navigation
- [ ] Navigate to Human Resources > PPE
- [ ] Navigate to HR > PPE > Deliveries
- [ ] Navigate to HR > PPE > Schedules
- [ ] Navigate to HR > PPE > Sizes
- [ ] Verify all subsections load correctly
- [ ] Navigate to HR > PPE > Sizes > List
- [ ] Select a size
- [ ] Navigate to size details
- [ ] Verify route: `/(tabs)/human-resources/ppe/sizes/details/[id]`

### Test 10: Error Handling and Edge Cases
- [ ] Attempt to navigate to invalid route
- [ ] Verify fallback to home page works
- [ ] Verify error is logged in console
- [ ] Navigate to a detail page with invalid ID
- [ ] Verify error handling shows appropriate message
- [ ] Rapidly navigate through multiple nested levels
- [ ] Verify no race conditions or crashes
- [ ] Close and reopen the app
- [ ] Verify last route is not persisted (or is, if persistence is implemented)

## Menu State Verification

### Test 11: Parent Item Highlighting
For each nested route tested above:
- [ ] Verify top-level parent shows "in-path" state (subtle highlight)
- [ ] Verify direct parent shows "active" state (full highlight)
- [ ] Verify non-related menu items are not highlighted
- [ ] Verify menu expansion state is correct

### Test 12: Menu Expansion State
- [ ] Navigate to deeply nested route
- [ ] Verify all parent menus are expanded
- [ ] Verify other top-level menus are collapsed
- [ ] Navigate to different section
- [ ] Verify previous section menus collapse
- [ ] Verify new section menus expand

### Test 13: Contextual Menu Items
- [ ] Navigate to a detail page (e.g., product details)
- [ ] Verify "Edit" contextual item appears in menu
- [ ] Navigate to an edit page
- [ ] Verify "Details" contextual item appears in menu
- [ ] Verify contextual items only appear when relevant

## Performance Verification

### Test 14: Navigation Performance
- [ ] Measure time to navigate between simple routes
- [ ] Verify average < 300ms
- [ ] Measure time to navigate between nested routes
- [ ] Verify average < 500ms
- [ ] Verify no memory leaks during navigation
- [ ] Monitor app memory usage (should stay < 50MB delta)

### Test 15: Rendering Performance
- [ ] Navigate through nested routes
- [ ] Verify no unnecessary re-renders
- [ ] Verify menu updates smoothly
- [ ] Verify breadcrumbs update without flicker
- [ ] Verify no UI jank during navigation

## Accessibility Verification

### Test 16: Screen Reader Support
- [ ] Enable screen reader (VoiceOver/TalkBack)
- [ ] Navigate through nested routes
- [ ] Verify screen reader announces correct page titles
- [ ] Verify back button is properly labeled
- [ ] Verify menu items are properly labeled

### Test 17: Keyboard Navigation
- [ ] Use keyboard to navigate through menu
- [ ] Verify Tab key moves through menu items
- [ ] Verify Enter key activates menu items
- [ ] Verify Arrow keys navigate between levels
- [ ] Verify Escape key closes submenus

## Developer Experience Verification

### Test 18: Console Logs
- [ ] Enable developer mode
- [ ] Navigate through nested routes
- [ ] Verify helpful navigation logs appear
- [ ] Verify no error logs appear
- [ ] Verify route validation messages are clear

### Test 19: Code Quality
- [ ] Run TypeScript type checking: `npm run tsc`
- [ ] Verify no TypeScript errors
- [ ] Run linter: `npm run lint`
- [ ] Verify no linting errors
- [ ] Review console warnings
- [ ] Verify no React warnings

## Documentation Verification

### Test 20: Documentation Completeness
- [ ] Review `/NESTED_ROUTING_FIX_SUMMARY.md`
- [ ] Verify all issues are documented
- [ ] Verify all fixes are explained
- [ ] Verify examples are clear
- [ ] Verify migration guide is complete

## Regression Testing

### Test 21: Existing Navigation Still Works
- [ ] Test all single-level routes
- [ ] Verify home navigation works
- [ ] Verify settings navigation works
- [ ] Verify personal section navigation works
- [ ] Verify authentication flows still work

### Test 22: Drawer Functionality
- [ ] Open drawer from header button
- [ ] Verify drawer opens smoothly
- [ ] Navigate using drawer menu
- [ ] Verify drawer closes after navigation
- [ ] Verify drawer state is maintained correctly

### Test 23: Back Button Functionality
- [ ] Test back button on simple routes
- [ ] Test back button on nested routes
- [ ] Test back button after cross-section navigation
- [ ] Verify history is maintained correctly
- [ ] Verify back button doesn't appear on home screen

## Sign-Off

### Development Team
- [ ] Developer 1: _____________________ Date: _______
- [ ] Developer 2: _____________________ Date: _______
- [ ] Code Reviewer: ___________________ Date: _______

### QA Team
- [ ] QA Engineer 1: ___________________ Date: _______
- [ ] QA Engineer 2: ___________________ Date: _______
- [ ] QA Manager: ______________________ Date: _______

### Product Team
- [ ] Product Manager: _________________ Date: _______
- [ ] UX Designer: _____________________ Date: _______

## Issues Found During Testing

| Issue # | Description | Severity | Status | Assignee | Notes |
|---------|-------------|----------|--------|----------|-------|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

## Notes and Observations

### Positive Findings
-

### Areas for Improvement
-

### Future Enhancements
-

## Final Approval

- [ ] All critical issues resolved
- [ ] All high-priority issues resolved or documented
- [ ] Performance meets requirements
- [ ] Accessibility requirements met
- [ ] Documentation complete and accurate
- [ ] Ready for production deployment

**Approved by**: _____________________
**Date**: _______
**Version**: _______
