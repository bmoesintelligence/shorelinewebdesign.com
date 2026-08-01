//
//    FAQ accordion
//
// The CodeStitch script, with two changes:
//
//  1. The listener sits on the <button>, not the whole <li>. In the original,
//     any click inside an open item toggled it — so trying to select the answer
//     text collapsed the answer.
//  2. aria-expanded is kept in sync. The service pages claim WCAG 2.2 AA a few
//     sections further up; without this a screen reader announces the button
//     but can't tell whether the answer is open or closed.
//
// Loaded on every page (see layouts/base.html). Pages with no .cs-faq-item
// simply get an empty list and do nothing.

const faqItems = Array.from(document.querySelectorAll(".cs-faq-item"));

for (const item of faqItems) {
    const button = item.querySelector(".cs-button");
    if (!button) continue;

    // the markup ships one item pre-opened with .active, so seed from the DOM
    button.setAttribute("aria-expanded", item.classList.contains("active") ? "true" : "false");

    button.addEventListener("click", () => {
        const isOpen = item.classList.toggle("active");
        button.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
}
