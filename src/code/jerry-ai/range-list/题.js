// Range List
// Guidelines
// In this part of the interview process, we'd like you to come up with an algorithm to
// solve the problem as described below. The problem itself is quite simple to solve.
// What we are mainly looking for in this test (other than that the solution should work)
// is, how well you actually write the code. We want to see how you write production￾quality code in a team setting where multiple developers will be collaborating on the
// codebase.
// Specifically, we are looking for: simple, clean, readable and maintainable code, for
// example:
// Code organization and submission format. Things like code organization,
// readability, documentation, testing and deliverability are most important here.
// Your mastery of idiomatic programming.
// The solution is prefered to be in JavaScript. We understand that you may not have much
// experience with JS. We encourage you to take some time to research modern JS and best
// practices, and try your best to apply them when writing your test solution.
// If you choose to use a programming language other than JS, please still make sure you
// stick to the idiomatic way of that programming language.
// Problem Set
// Please use the exact class name, method name and input/output formats in this code
// template.
// // Task: Implement a class named 'RangeList'
// // A pair of integers define a range, for example: [1, 5). This range includes
// integers: 1, 2, 3, and 4.
// // A range list is an aggregate of these ranges: [1, 5), [10, 11), [100, 201)
// /**
// *
// * NOTE: Feel free to add any extra member variables/functions you like.
// */
// class RangeList {
// /**
// *
// * Adds a range to the list
// * @param {Array<number>} range - Array of two integers that specify beginning and
// end of range.
// */
// add(range) {
// // TODO: implement this
// }
// /**
// *
// * Removes a range from the list
// * @param {Array<number>} range - Array of two integers that specify beginning and
// end of range.
// */
// remove(range) {
// // TODO: implement this
// }
// /**
// *
// * Convert the list of ranges in the range list to a string
// * @returns A string representation of the range list
// */
// toString() {
// // TODO: implement this
// }
// }
// // Example run
// const rl = new RangeList();
// rl.toString(); // Should be ""
// rl.add([1, 5]);
// rl.toString(); // Should be: "[1, 5)"
// rl.add([10, 20]);
// rl.toString(); // Should be: "[1, 5) [10, 20)"
// rl.add([20, 20]);
// rl.toString(); // Should be: "[1, 5) [10, 20)"
// rl.add([20, 21]);
// rl.toString(); // Should be: "[1, 5) [10, 21)"
// rl.add([2, 4]);
// rl.toString(); // Should be: "[1, 5) [10, 21)"
// rl.add([3, 8]);
// rl.toString(); // Should be: "[1, 8) [10, 21)"
// rl.remove([10, 10]);
// rl.toString(); // Should be: "[1, 8) [10, 21)"
// rl.remove([10, 11]);
// rl.toString(); // Should be: "[1, 8) [11, 21)"
// rl.remove([15, 17]);
// rl.toString(); // Should be: "[1, 8) [11, 15) [17, 21)"
// rl.remove([3, 19]);
// rl.toString(); // Should be: "[1, 3) [19, 21)"