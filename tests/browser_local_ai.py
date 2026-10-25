"""Browser direct-local model wiring. Mock model endpoint; real app validation API."""
import json
import os
from playwright.sync_api import sync_playwright, expect

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.getenv('BATON_CHROMIUM', '/usr/bin/chromium'), headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    failures = []
    requests = []
    page.on('pageerror', lambda e: failures.append(str(e)))
    page.goto('http://127.0.0.1:3000')
    page.get_by_role('button', name='새 인수인계서', exact=True).click()
    page.get_by_role('textbox', name='문서 제목', exact=True).fill('로컬 AI 테스트')
    page.get_by_role('textbox', name='참고 원문', exact=True).fill('매월 5일 업무 보고서를 제출한다. 담당자에게 미결 업무를 전달한다.')
    models = 'http://127.0.0.1:12345/v1/models'
    completion = 'http://127.0.0.1:12345/v1/chat/completions'
    page.route(models, lambda route: route.abort())
    page.get_by_role('button', name='로컬 AI 연결', exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('CORS')
    page.unroute(models)
    page.route(models, lambda route: route.fulfill(json={'data': []}))
    page.get_by_role('button', name='로컬 AI 연결', exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('사용 가능한 모델이 없습니다')
    page.unroute(models)
    page.route(models, lambda route: route.fulfill(json={'data': [{'id': 'local-gemma'}, {'id': 'another-model'}]}))
    page.get_by_role('button', name='로컬 AI 연결', exact=True).click()
    select = page.get_by_role('combobox', name='로컬 AI 모델', exact=True)
    expect(select).to_have_value('local-gemma')
    select.select_option('another-model')
    def generate(route):
        data = route.request.post_data_json
        requests.append(data)
        route.fulfill(json={'choices': [{'message': {'content': json.dumps({'summary': '로컬 모델 생성 요약', 'sections': [{'title': '보고 업무', 'text': '매월 5일 보고서를 제출한다.'}]})}, 'finish_reason': 'stop'}]})
    page.route(completion, generate)
    page.get_by_role('button', name='AI 초안 생성', exact=True).click()
    expect(page.get_by_role('textbox', name='요약', exact=True)).to_have_value('로컬 모델 생성 요약')
    assert requests[0]['model'] == 'another-model'
    assert '매월 5일' in requests[0]['messages'][1]['content']
    page.unroute(completion)
    page.route(completion, lambda route: route.fulfill(json={'choices': [{'message': {'content': '{}'}, 'finish_reason': 'length'}]}))
    page.get_by_role('button', name='AI 초안 생성', exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('잘렸거나')
    expect(page.get_by_role('textbox', name='요약', exact=True)).to_have_value('로컬 모델 생성 요약')
    expect(page.get_by_role('textbox', name='참고 원문', exact=True)).to_have_value('매월 5일 업무 보고서를 제출한다. 담당자에게 미결 업무를 전달한다.')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert not failures, failures
    browser.close()
    print('PASS: local connection failure, empty models, selection, direct browser generation, server validation, truncated response, input preservation, mobile')
