import {ConsecutiveRequestManager} from './consecutive-request-manager';

const assert = {
    equal(actual: unknown, expected: unknown, message = '值不相等') {
        if (actual !== expected) throw new Error(message);
    },
    ok(value: unknown, message = '断言失败') {
        if (!value) throw new Error(message);
    },
};

// 模拟支持 AbortSignal 的 fetch/axios 请求，请求只在收到取消信号时结束。
function createPendingApi(signal: AbortSignal): Promise<never> {
    return new Promise((_, reject) => {
        signal.addEventListener(
            'abort',
            () => reject(new DOMException('The request was aborted', 'AbortError')),
            {once: true},
        );
    });
}

// 场景 1：AAB 中两个 A 连续，第二个 A 应取消第一个 A，B 不受影响。
{
    const manager = new ConsecutiveRequestManager<string>();
    const firstA = manager.create('A');
    const secondA = manager.create('A');
    const requestB = manager.create('B');

    assert.equal(firstA.signal.aborted, true, 'AAB 应取消第一个 A');
    assert.equal(secondA.signal.aborted, false);
    assert.equal(requestB.signal.aborted, false);
}

// 场景 2：ABA 中两个 A 被 B 隔开，不进行连续取消；abortAll 再统一取消全部请求。
{
    const manager = new ConsecutiveRequestManager<string>();
    const firstA = manager.create('A');
    const requestB = manager.create('B');
    const secondA = manager.create('A');

    assert.equal(firstA.signal.aborted, false, 'ABA 中的两个 A 不连续，不应取消');
    assert.equal(requestB.signal.aborted, false);
    assert.equal(secondA.signal.aborted, false);

    manager.abortAll();
    assert.equal(firstA.signal.aborted, true);
    assert.equal(requestB.signal.aborted, true);
    assert.equal(secondA.signal.aborted, true);
}

// 场景 3：已完成的 A 已从活动集合释放，后续 A 不需要再取消它。
{
    const manager = new ConsecutiveRequestManager<string>();
    const completedA = manager.create('A');
    completedA.release();
    const nextA = manager.create('A');

    assert.equal(completedA.signal.aborted, false, '已完成的请求不需要再取消');
    assert.equal(nextA.signal.aborted, false);
}

// 场景 4（批量取消 demo）：同时发起多个不同接口，一次 abortAll 取消全部请求。
{
    const manager = new ConsecutiveRequestManager<string>();
    const userRequest = manager.create('load-user');
    const orderRequest = manager.create('load-orders');
    const messageRequest = manager.create('load-messages');

    // 先为每个 Promise 注册拒绝处理，避免取消时产生未处理的 Promise rejection。
    const results = Promise.allSettled([
        createPendingApi(userRequest.signal).finally(userRequest.release),
        createPendingApi(orderRequest.signal).finally(orderRequest.release),
        createPendingApi(messageRequest.signal).finally(messageRequest.release),
    ]);

    manager.abortAll('Component unmounted');

    const settledResults = await results;
    assert.equal(settledResults.length, 3);
    assert.ok(settledResults.every((result) => result.status === 'rejected'));
    assert.ok(
        settledResults.every(
            (result) => result.status === 'rejected' && result.reason.name === 'AbortError',
        ),
    );
    assert.ok(userRequest.signal.aborted);
    assert.ok(orderRequest.signal.aborted);
    assert.ok(messageRequest.signal.aborted);
}

console.log('ConsecutiveRequestManager tests passed.');
