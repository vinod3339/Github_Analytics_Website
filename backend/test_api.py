import asyncio
import httpx

async def run_verification():
    base_url = "http://127.0.0.1:8000/api"
    print("Testing API endpoints...")
    async with httpx.AsyncClient(timeout=15.0) as client:
        # 1. Test Login
        print("1. Testing Auth Login...")
        login_res = await client.post(f"{base_url}/auth/login", json={"username": "admin", "password": "admin123"})
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("   -> Login success! Token received.")

        # 2. Test Dashboard Summary
        print("2. Testing Dashboard Summary...")
        dash_res = await client.get(f"{base_url}/dashboard/summary", headers=headers)
        assert dash_res.status_code == 200, f"Dashboard summary failed: {dash_res.text}"
        summary = dash_res.json()
        print(f"   -> Summary: {summary['total_students']} students, {summary['total_repositories']} repos, {summary['total_commits']} commits.")

        # 3. Test Rankings
        print("3. Testing Dynamic Rankings...")
        rank_res = await client.get(f"{base_url}/rankings?date_filter=30d", headers=headers)
        assert rank_res.status_code == 200, f"Rankings failed: {rank_res.text}"
        rankings = rank_res.json()["rankings"]
        print(f"   -> Rankings calculated: Top student is {rankings[0]['student_name']} with score {rankings[0]['score']}")

        # 4. Test Student List
        print("4. Testing Students Endpoint...")
        st_res = await client.get(f"{base_url}/students", headers=headers)
        assert st_res.status_code == 200, f"Students failed: {st_res.text}"
        students = st_res.json()
        print(f"   -> Total students: {len(students)}")

        # 5. Test Student Profile
        print("5. Testing Student Profile...")
        first_student_id = students[0]["id"]
        prof_res = await client.get(f"{base_url}/students/{first_student_id}", headers=headers)
        assert prof_res.status_code == 200, f"Student profile failed: {prof_res.text}"
        print(f"   -> Student profile loaded for {prof_res.json()['student']['name']}")

        # 5b. Test Student Registration Endpoint
        print("5b. Testing Student Registration with GitHub Sync...")
        test_student_id = f"REG-TEST-{int(asyncio.get_event_loop().time())}"
        reg_payload = {
            "student_id": test_student_id,
            "name": "Integration Test Student",
            "email": f"test.{int(asyncio.get_event_loop().time())}@university.edu",
            "github_username": "octocat",
            "department": "Computer Science & Engineering",
            "batch": "2024-2028",
            "track_all_public_repos": False,
            "selected_repositories": ["octocat/Hello-World"],
            "auto_sync": False
        }
        reg_res = await client.post(f"{base_url}/students/register", json=reg_payload)
        assert reg_res.status_code in [200, 201], f"Registration failed: {reg_res.text}"
        print(f"   -> Student registered: {reg_res.json()['student']['name']} ({reg_res.json()['student']['student_id']})")

        # 6. Test Repositories
        print("6. Testing Repositories...")
        repo_res = await client.get(f"{base_url}/repositories", headers=headers)
        assert repo_res.status_code == 200, f"Repositories failed: {repo_res.text}"
        repos = repo_res.json()
        print(f"   -> Repositories count: {len(repos)}")

        # 7. Test Commits
        print("7. Testing Commits...")
        comm_res = await client.get(f"{base_url}/commits?limit=5", headers=headers)
        assert comm_res.status_code == 200, f"Commits failed: {comm_res.text}"
        print(f"   -> Commits items count: {len(comm_res.json()['items'])}")

        # 8. Test Pull Requests
        print("8. Testing Pull Requests...")
        pr_res = await client.get(f"{base_url}/pull-requests?limit=5", headers=headers)
        assert pr_res.status_code == 200, f"Pull requests failed: {pr_res.text}"
        print(f"   -> PRs items count: {len(pr_res.json()['items'])}")

        # 9. Test Issues
        print("9. Testing Issues...")
        iss_res = await client.get(f"{base_url}/issues?limit=5", headers=headers)
        assert iss_res.status_code == 200, f"Issues failed: {iss_res.text}"
        print(f"   -> Issues items count: {len(iss_res.json()['items'])}")

        # 10. Test Analytics
        print("10. Testing Analytics Overview...")
        an_res = await client.get(f"{base_url}/analytics", headers=headers)
        assert an_res.status_code == 200, f"Analytics failed: {an_res.text}"
        print("   -> Analytics overview received successfully.")

        # 11. Test Export CSV
        print("11. Testing CSV Export...")
        exp_res = await client.get(f"{base_url}/export/rankings?format=csv", headers=headers)
        assert exp_res.status_code == 200, f"Export failed: {exp_res.text}"
        print(f"   -> CSV Export returned {len(exp_res.text)} bytes.")

        # 12. Test Global Search
        print("12. Testing Global Search...")
        srch_res = await client.get(f"{base_url}/search?q=Rahul", headers=headers)
        assert srch_res.status_code == 200, f"Search failed: {srch_res.text}"
        print(f"   -> Search results: {len(srch_res.json()['students'])} students matched.")

        print("\nAll 12 backend verification checks passed successfully!")

if __name__ == "__main__":
    asyncio.run(run_verification())
