export interface NavbarCompactStateInput {
	enabled: boolean;
	isTransitioning: boolean;
	homeStoryExpanded: boolean;
	scrollTop: number;
	current: boolean;
}

export interface NavbarCompactHandlerOwner {
	semifullScrollHandler?: () => void;
}

export function resolveNavbarCompactState({
	enabled,
	isTransitioning,
	homeStoryExpanded,
	scrollTop,
	current,
}: NavbarCompactStateInput): boolean {
	if (!enabled || homeStoryExpanded) return false;
	if (isTransitioning) return current;
	if (scrollTop > 80) return true;
	if (scrollTop < 40) return false;
	return current;
}

export function replaceNavbarCompactHandler(
	owner: NavbarCompactHandlerOwner,
	windowTarget: EventTarget,
	storyTarget: EventTarget,
	nextHandler?: () => void,
	compactEventsEnabled = true,
): void {
	const previousHandler = owner.semifullScrollHandler;
	if (previousHandler) {
		windowTarget.removeEventListener("scroll", previousHandler);
		windowTarget.removeEventListener("resize", previousHandler);
		storyTarget.removeEventListener(
			"charlore:home-story-nav-state",
			previousHandler,
		);
	}

	owner.semifullScrollHandler = nextHandler;
	if (!nextHandler) return;

	windowTarget.addEventListener("resize", nextHandler, { passive: true });
	if (compactEventsEnabled) {
		windowTarget.addEventListener("scroll", nextHandler, { passive: true });
		storyTarget.addEventListener("charlore:home-story-nav-state", nextHandler);
	}
}
