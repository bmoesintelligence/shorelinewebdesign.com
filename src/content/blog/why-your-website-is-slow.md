---
title: Why your website is slow
description: "Most small-business sites aren't slow because of hosting, but
  because of what got installed on top. What actually causes it, and how to
  check your own site. "
standfirst: Almost every small-business owner I talk to has been told their
  website is slow. Almost none of them have been told why, in words they can act
  on. The usual answer is "you need better hosting," which is occasionally true
  and usually not. Here is what is actually going on, without the jargon.
date: 2026-07-20T09:00:00.000-07:00
author: Bryan Moe
tags:
  - post
---
## What "slow" means, specifically

Google measures three things about a page, and you can measure them too. They're called Core Web Vitals, and they matter because they describe what a visitor experiences rather than what a server does.

**Largest Contentful Paint** is how long until the biggest thing on the screen shows up. Usually your headline or your hero image. Under 2.5 seconds is considered good. Over 4 seconds is considered poor.

**Interaction to Next Paint** is how long the page takes to respond when someone taps or clicks. Under 200 milliseconds is good. Over 500 is poor. This is the one that makes a site feel broken on a phone, because the visitor taps a button and nothing happens, so they tap it again.

**Cumulative Layout Shift** is how much the page jumps around while it loads. That's the effect where you go to tap a link and an ad or an image loads above it, everything moves down, and you tap the wrong thing. Under 0.1 is good, over 0.25 is poor.

Notice that none of these is "page load time." That number stopped being useful a long time ago, because a page can technically finish loading quickly and still feel terrible to use.

## The actual causes, roughly in order

**Plugins and third-party scripts.** This is the big one, and it isn't close. A booking widget, a chat bubble, a review carousel, an analytics tag, a heatmap tracker, a popup builder, a font loader. Each one is code from someone else's server that your visitor's phone has to download and run before your site becomes usable. Individually they all seem harmless. Twelve of them is a slow website, and no amount of hosting fixes it, because the delay is happening on your visitor's device, not yours.

**Images at the wrong size.** A photo straight off a phone is often 4000 pixels wide and several megabytes. On a phone screen it renders at maybe 400 pixels. The browser still downloads the whole thing, then throws away most of it. A site with ten of those on the home page is downloading twenty or thirty megabytes to show something that should weigh under one.

**Page builders.** Drag-and-drop editors have to be general enough to build anything, so they ship a large amount of code that handles cases your page doesn't use. They also tend to produce deeply nested markup, which is slower for the browser to lay out. This is a real tradeoff, not a scam. You get flexibility without a developer, and you pay for it in weight.

**Hosting.** Genuinely does matter, but it's usually the smallest of these, and it only shows up as slow *first byte* time. If your host is the problem, everything is uniformly sluggish, including pages with almost nothing on them. That's a specific symptom, and it's less common than the other three.

## What doesn't fix it

**A caching plugin.** Caching helps with repeat visits and with server load. It does nothing about the twelve third-party scripts, because those load fresh from someone else's server every time.

**A faster hosting plan.** See above. If the bottleneck is on the visitor's phone, a bigger server is money spent on the wrong end of the problem.

**Deleting your images.** The images usually aren't the problem. Images at the wrong *size* are the problem, and that's fixable without removing anything.

## How to check your own site

Go to [PageSpeed Insights](https://pagespeed.web.dev/) and put your URL in. It's free and it's Google's own tool, so it's measuring roughly what Google measures.

Two things to know before you look at the score.

First, **read the mobile tab, not desktop.** Most of your visitors are on a phone, on a cell connection, holding a device with a fraction of your laptop's processing power. Desktop scores flatter everyone.

Second, **ignore the big number and scroll down.** The score out of 100 is a weighted composite and it moves around between runs. The useful part is the "Opportunities" and "Diagnostics" sections underneath, which name specific files and tell you how much time each one is costing. That's a list you can hand to whoever maintains your site.

If you see a list of scripts you don't recognise, that's your answer. Those got added one at a time, each for a decent reason, and nobody ever removed the ones that stopped being used.

## Is it worth fixing?

Honest answer: it depends on what your site is for.

Speed is a ranking signal for Google, but a modest one. A fast site does not outrank a slow site with better content and more established links. Anyone who tells you a perfect score will move you to the top of the results is selling something.

The stronger argument is the visitor, not the search engine. Someone who found you on their phone, on a patchy connection, standing outside your competitor's shop, will not wait around. That person is worth more to you than a ranking position, and they're the one a slow site actually costs you.

So: worth fixing if people arrive on their phones ready to act. Less urgent if your site is mostly a reference that customers visit after they already know you.

- - -

*I build hand-coded sites for small businesses around the North Sound, which is a long way of saying there's no page builder and no plugin stack to get slow in the first place. If you want to know what your current site is doing, [send me the URL](/contact/) and I'll tell you what I see, no charge and no pitch.*
