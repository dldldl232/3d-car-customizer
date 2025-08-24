# Frontend Testing Guide - Phase 1

## 🚗 Testing the Enhanced Auto Placement System

### Prerequisites
- Backend server running on http://localhost:8000 ✅
- Frontend server running on http://localhost:3000

### Test Steps

#### 1. Start Frontend Server
```bash
cd car-customization-app
npm run dev
```

#### 2. Open Browser
Navigate to: http://localhost:3000

#### 3. Test Car Model Loading
- ✅ Should see the Porsche 911 car model
- ✅ Car should be properly scaled and positioned
- ✅ No sinking or oversized issues

#### 4. Test Part Selection
1. **Select "Sport Wheels"**
   - ✅ Wheels should appear at all 4 wheel positions
   - ✅ Wheels should be properly scaled (0.6x)
   - ✅ Wheels should have metallic appearance
   - ✅ Position: Front Left (-0.8, 0, -1.2), Front Right (0.8, 0, -1.2), etc.

2. **Select "Sport Spoiler"**
   - ✅ Spoiler should appear at rear of car
   - ✅ Position: (0, 1.2, -2.5) - elevated at rear
   - ✅ Scale: 1.0x (full size)

3. **Select "Carbon Fiber Hood"**
   - ✅ Hood should appear at center of car
   - ✅ Position: (0, 1.0, 0) - elevated at center
   - ✅ Scale: 1.0x (full size)

4. **Select "LED Headlights"**
   - ✅ Headlights should appear at front of car
   - ✅ Position: Left (-0.6, 0.8, 2.6), Right (0.6, 0.8, 2.6)
   - ✅ Scale: 0.6x (smaller)
   - ✅ Should have emissive glow effect

#### 5. Test Multiple Parts
- ✅ Select multiple parts simultaneously
- ✅ All parts should appear at correct positions
- ✅ No conflicts or overlapping

#### 6. Test Part Deselection
- ✅ Click parts again to deselect
- ✅ Parts should disappear from 3D scene

### Expected Results

#### ✅ Auto Placement Working
- Parts automatically find correct anchors
- Proper scaling applied based on part type
- Correct positioning at wheel wells, headlights, etc.

#### ✅ Visual Effects
- Wheels: Metallic finish (metalness: 0.8, roughness: 0.2)
- Headlights: Yellow emissive glow
- Performance parts: Subtle red glow
- All parts: Proper shadows and lighting

#### ✅ Performance
- Smooth 3D rendering
- No lag or stuttering
- Responsive part selection

### Debug Information

Check browser console for:
- Anchor loading messages
- Part positioning logs
- Transform calculations
- Material application logs

### Common Issues & Solutions

#### Issue: Parts not appearing
- Check if anchors are loaded (console logs)
- Verify part GLB URLs are accessible
- Check for JavaScript errors

#### Issue: Parts in wrong positions
- Verify anchor data is correct
- Check part `attach_to` field
- Verify auto-placement logic

#### Issue: Parts too big/small
- Check part scaling logic
- Verify anchor scale values
- Check part-specific adjustments

### Success Criteria

✅ **Phase 1 Complete** when:
- All parts position correctly at anchors
- Proper scaling applied automatically
- Visual effects working
- Performance is smooth
- No console errors

---

**Next Phase**: Edit Mode with Gizmos for manual adjustments 