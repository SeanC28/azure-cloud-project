// This variable lives in the server's RAM
let globalCount = 0;

module.exports = async function (context, req) {
    // Increment the count
    globalCount = globalCount + 1;

    context.res = {
        body: { count: globalCount },
        headers: { "Content-Type": "application/json" }
    };
}
