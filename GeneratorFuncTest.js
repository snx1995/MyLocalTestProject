function* test() {
    yield 'step 1';
    yield 'step 2';
    const tmp = yield 3 * 2;
    console.log(tmp);
    return 'step 4';
}

const t = test();
let result;
do {
    result = t.next();
    console.log(result);
} while (result && !result.done);
