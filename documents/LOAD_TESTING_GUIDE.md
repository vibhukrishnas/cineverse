# Load Testing Guide
**Project:** CineVerse  
**Date:** October 27, 2025

---

## 🎯 Load Testing Strategy

### Objectives
1. Test application under realistic concurrent user load
2. Identify performance bottlenecks
3. Measure API response times
4. Validate database query performance
5. Document honest, realistic results

### Realistic Scope
- **Target:** 100-500 concurrent users (honest scale)
- **Why not 5000?** Free/dev tier Supabase has connection limits
- **Focus:** Quality metrics over inflated numbers

---

## 🛠️ Setup Artillery Load Testing

### Step 1: Install Artillery
```powershell
npm install --save-dev artillery
```

### Step 2: Create Test Scenarios
See `load-tests/` directory for test scripts.

### Step 3: Run Tests
```powershell
# Test homepage
npx artillery run load-tests/test-homepage.yml

# Test API endpoints
npx artillery run load-tests/test-api.yml

# Test full user journey
npx artillery run load-tests/test-user-journey.yml
```

---

## 📊 Test Scenarios

### Scenario 1: Homepage Load Test
**Simulates:** 100 users browsing homepage over 2 minutes

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 5 # 5 users/second
      name: "Warm up"
    - duration: 120
      arrivalRate: 10 # 10 users/second
      name: "Peak load"
  processor: "./load-tests/processor.js"

scenarios:
  - name: "Browse Homepage"
    flow:
      - get:
          url: "/"
```

### Scenario 2: Movie Search
**Simulates:** Users searching for movies

```yaml
scenarios:
  - name: "Search Movies"
    flow:
      - get:
          url: "/search?q=inception"
      - think: 2 # User reads results for 2 seconds
      - get:
          url: "/movie/27205" # Click on result
```

### Scenario 3: User Journey
**Simulates:** Complete user flow

```yaml
scenarios:
  - name: "Full User Journey"
    flow:
      - get:
          url: "/"
      - think: 3
      - get:
          url: "/discover"
      - think: 5
      - get:
          url: "/movie/550" # View Fight Club
      - think: 10 # Read details
      - get:
          url: "/theaters" # Browse theaters
```

---

## 📈 Expected Metrics

### Response Time Targets
| Endpoint | Target | Acceptable | Poor |
|----------|--------|------------|------|
| Homepage (/) | < 1s | < 2s | > 3s |
| Movie Details | < 1.5s | < 3s | > 5s |
| Search | < 2s | < 3s | > 5s |
| API Calls | < 500ms | < 1s | > 2s |
| Database Queries | < 200ms | < 500ms | > 1s |

### Throughput Targets
- **Requests/sec:** 50-100 (realistic)
- **Concurrent Users:** 100-500 (honest scale)
- **Error Rate:** < 1%
- **Success Rate:** > 99%

---

## 🚀 Running Load Tests

### Prerequisites
```powershell
# Ensure dev server is running
npm run dev

# Install Artillery
npm install --save-dev artillery

# Verify Artillery installed
npx artillery --version
```

### Test Execution

#### Test 1: Light Load (50 users)
```powershell
npx artillery quick --count 50 --num 10 http://localhost:3000
```

#### Test 2: Medium Load (200 users)
```powershell
npx artillery run load-tests/test-medium-load.yml
```

#### Test 3: Heavy Load (500 users)
```powershell
npx artillery run load-tests/test-heavy-load.yml
```

### Generate Report
```powershell
npx artillery run load-tests/test-api.yml --output report.json
npx artillery report report.json
```

---

## 📊 Results Template

### Homepage Load Test Results
```
Test Duration: 3 minutes
Total Requests: 1,200
Concurrent Users: 100
Arrival Rate: 10 users/second

Response Times:
  min: ___ ms
  max: ___ ms
  median: ___ ms
  p95: ___ ms
  p99: ___ ms

Throughput: ___ requests/sec
Success Rate: ___% 
Error Rate: ___%

Status Codes:
  200: ___ (___%)
  404: ___ (___%)
  500: ___ (___%)
```

### API Endpoints Performance
```
GET /api/movies/discover:
  Avg Response Time: ___ ms
  Success Rate: ___%

GET /api/movies/trending:
  Avg Response Time: ___ ms
  Success Rate: ___%

POST /api/reviews:
  Avg Response Time: ___ ms
  Success Rate: ___%
```

---

## 🎯 Honest Assessment Framework

### What We CAN Test:
✅ Frontend response times
✅ API endpoint performance
✅ Page load speeds
✅ Concurrent user simulation (100-500)
✅ Error rates under load

### What We CANNOT Test (Honestly):
❌ 5000+ concurrent users (requires production infrastructure)
❌ True scalability (limited by dev environment)
❌ CDN performance (local development)
❌ Global load distribution
❌ Auto-scaling behavior

### Realistic Claims for Report:
- ✅ "Tested with 200-500 concurrent simulated users"
- ✅ "Measured response times under realistic load"
- ✅ "Identified and documented bottlenecks"
- ✅ "Optimized for expected user traffic"
- ❌ "Load tested with 5000 concurrent users"
- ❌ "Validated infinite scalability"

---

## 🛠️ Interpreting Results

### Good Performance Indicators:
- Median response time < 1s
- P95 response time < 3s
- Error rate < 1%
- No 500 errors
- Consistent throughput

### Warning Signs:
- P95 response time > 5s
- Error rate > 5%
- Increasing response times over test duration
- Memory leaks (monitor with `node --inspect`)

### Critical Issues:
- Server crashes
- Database connection pool exhaustion
- Memory overflow
- 500 errors > 10%

---

## 📝 Load Testing Checklist

- [ ] Install Artillery
- [ ] Create test scenarios for key pages
- [ ] Run baseline test (10 users)
- [ ] Run light load test (50 users)
- [ ] Run medium load test (200 users)
- [ ] Run heavy load test (500 users)
- [ ] Document response times
- [ ] Document error rates
- [ ] Identify bottlenecks
- [ ] Optimize slow endpoints
- [ ] Re-run tests after optimizations
- [ ] Generate final report with honest numbers
- [ ] Screenshot Artillery results
- [ ] Update mini project report with actual data

---

## 🎯 Deliverables

1. **Test Scripts:** `load-tests/*.yml` files
2. **Test Results:** Screenshots + JSON reports
3. **Performance Analysis:** Bottlenecks identified
4. **Optimization Log:** Changes made to improve performance
5. **Final Report:** Honest assessment with real data

---

## 💡 Pro Tips

1. **Start Small:** Begin with 10 users, gradually increase
2. **Monitor Resources:** Watch CPU, memory, database connections
3. **Test in Production Mode:** `npm run build && npm start`
4. **Use Realistic Scenarios:** Mimic actual user behavior
5. **Be Honest:** Report what you actually tested, not aspirations
6. **Document Limitations:** Free tier Supabase, local dev environment
7. **Focus on Improvements:** Show before/after optimization

---

## 🚨 Important Notes

### For Academic Integrity:
- **Report actual numbers tested**
- **Don't inflate concurrent user counts**
- **Document test environment limitations**
- **Be transparent about constraints**

### For Real-World Value:
- 100-500 concurrent users is realistic for most apps
- Proper optimization matters more than raw scale
- Understanding bottlenecks demonstrates real skill
- Honest testing builds credibility

---

## Next Steps

1. Create `load-tests/` directory
2. Write Artillery test scenarios
3. Run progressive load tests
4. Document actual results
5. Update report with honest data
