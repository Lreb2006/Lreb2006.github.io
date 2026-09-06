import assert from "node:assert/strict";
import test from "node:test";

type ResolveNavbarCompactState = (input: {
	enabled: boolean;
	isTransitioning: boolean;
	homeStoryExpanded: boolean;
	scrollTop: number;
	current: boolean;
}) => boolean;

type NavbarCompactHandlerOwner = {
	semifullScrollHandler?: () => void;
};

type ReplaceNavbarCompactHandler = (
	owner: NavbarCompactHandlerOwner,
	windowTarget: EventTarget,
	storyTarget: EventTarget,
	nextHandler?: () => void,
	compactEventsEnabled?: boolean,
) => void;

let resolveNavbarCompactState: ResolveNavbarCompactState = () => true;
let replaceNavbarCompactHandler: ReplaceNavbarCompactHandler = () => {};

try {
	const compactState = await import("./navbar-compact-state");
	resolveNavbarCompactState = compactState.resolveNavbarCompactState;
	replaceNavbarCompactHandler = compactState.replaceNavbarCompactHandler;
} catch {
	// Fallbacks keep the red run focused on the missing lifecycle owner.
}

test("a page without compact mode always expands stale navbar state", () => {
	assert.equal(
		resolveNavbarCompactState({
			enabled: false,
			isTransitioning: true,
			homeStoryExpanded: false,
			scrollTop: 600,
			current: true,
		}),
		false,
	);
});

test("compact mode keeps its scroll hysteresis and homepage expansion override", () => {
	assert.equal(
		resolveNavbarCompactState({
			enabled: true,
			isTransitioning: false,
			homeStoryExpanded: false,
			scrollTop: 81,
			current: false,
		}),
		true,
	);
	assert.equal(
		resolveNavbarCompactState({
			enabled: true,
			isTransitioning: false,
			homeStoryExpanded: false,
			scrollTop: 60,
			current: true,
		}),
		true,
	);
	assert.equal(
		resolveNavbarCompactState({
			enabled: true,
			isTransitioning: false,
			homeStoryExpanded: true,
			scrollTop: 600,
			current: true,
		}),
		false,
	);
});

test("replacing the compact handler removes the old listener from both targets", () => {
	const owner: NavbarCompactHandlerOwner = {};
	const scrollTarget = new EventTarget();
	const storyTarget = new EventTarget();
	let oldCalls = 0;
	let nextCalls = 0;
	const oldHandler = () => {
		oldCalls += 1;
	};
	const nextHandler = () => {
		nextCalls += 1;
	};

	replaceNavbarCompactHandler(
		owner,
		scrollTarget,
		storyTarget,
		oldHandler,
		true,
	);
	replaceNavbarCompactHandler(
		owner,
		scrollTarget,
		storyTarget,
		nextHandler,
		true,
	);
	scrollTarget.dispatchEvent(new Event("scroll"));
	scrollTarget.dispatchEvent(new Event("resize"));
	storyTarget.dispatchEvent(new Event("charlore:home-story-nav-state"));

	assert.equal(oldCalls, 0);
	assert.equal(nextCalls, 3);

	replaceNavbarCompactHandler(owner, scrollTarget, storyTarget);
	scrollTarget.dispatchEvent(new Event("scroll"));
	storyTarget.dispatchEvent(new Event("charlore:home-story-nav-state"));
	assert.equal(nextCalls, 3);
	assert.equal(owner.semifullScrollHandler, undefined);
});

test("a non-compact page listens only for geometry-changing resizes", () => {
	const owner: NavbarCompactHandlerOwner = {};
	const windowTarget = new EventTarget();
	const storyTarget = new EventTarget();
	let calls = 0;

	replaceNavbarCompactHandler(
		owner,
		windowTarget,
		storyTarget,
		() => {
			calls += 1;
		},
		false,
	);
	windowTarget.dispatchEvent(new Event("scroll"));
	storyTarget.dispatchEvent(new Event("charlore:home-story-nav-state"));
	assert.equal(calls, 0);

	windowTarget.dispatchEvent(new Event("resize"));
	assert.equal(calls, 1);
});
