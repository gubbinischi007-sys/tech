import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

interface OnboardingTourProps {
    /** Called when tour finishes or is skipped */
    onComplete?: () => void;
    /** Force the tour to show even if already completed */
    force?: boolean;
}

const TOUR_KEY = 'smartcruiter_onboarding_done';

export default function OnboardingTour({ onComplete, force = false }: OnboardingTourProps) {
    const driverRef = useRef<ReturnType<typeof driver> | null>(null);

    useEffect(() => {
        const alreadyDone = localStorage.getItem(TOUR_KEY);
        if (alreadyDone && !force) return;

        // Small delay so the page renders first
        const timeout = setTimeout(() => {
            const driverObj = driver({
                showProgress: true,
                animate: true,
                allowClose: true,
                overlayColor: 'rgba(0, 0, 0, 0.7)',
                smoothScroll: true,
                stagePadding: 8,
                stageRadius: 10,
                popoverClass: 'smartcruiter-tour-popover',
                progressText: '{{current}} of {{total}}',
                nextBtnText: 'Next →',
                prevBtnText: '← Back',
                doneBtnText: '🎉 Let\'s Go!',
                onDestroyStarted: () => {
                    localStorage.setItem(TOUR_KEY, 'true');
                    onComplete?.();
                    driverObj.destroy();
                },
                steps: [
                    {
                        element: '.logo',
                        popover: {
                            title: '👋 Welcome to SmartCruiter!',
                            description: 'Your AI-powered recruitment platform. Let\'s take a quick tour to get you up to speed.',
                            side: 'bottom',
                            align: 'start',
                        }
                    },
                    {
                        element: 'a[href="/admin/dashboard"]',
                        popover: {
                            title: '📊 Dashboard',
                            description: 'Your command center. See key recruitment metrics, upcoming interviews, and recent activity at a glance.',
                            side: 'bottom',
                        }
                    },
                    {
                        element: 'a[href="/admin/jobs"]',
                        popover: {
                            title: '💼 Jobs',
                            description: 'Create and manage job postings. Set requirements, track status, and control your pipeline.',
                            side: 'bottom',
                        }
                    },
                    {
                        element: 'a[href="/admin/applicants"]',
                        popover: {
                            title: '👥 Applicants',
                            description: 'Review all candidates in one place. AI match scores help you shortlist the right people faster.',
                            side: 'bottom',
                        }
                    },
                    {
                        element: 'a[href="/admin/interviews"]',
                        popover: {
                            title: '📅 Interviews',
                            description: 'Schedule and manage all interviews. Integrated with Cal.com for seamless booking.',
                            side: 'bottom',
                        }
                    },
                    {
                        element: 'a[href="/admin/history"]',
                        popover: {
                            title: '📋 History',
                            description: 'Full audit trail of all hiring decisions, login activity, and actions performed on the platform.',
                            side: 'bottom',
                        }
                    },
                    {
                        element: '.logout-btn',
                        popover: {
                            title: '✅ You\'re all set!',
                            description: 'Your profile and logout button live here. You can restart this tour anytime from your profile settings.',
                            side: 'bottom',
                            align: 'end',
                        }
                    }
                ]
            });

            driverRef.current = driverObj;
            driverObj.drive();
        }, 800);

        return () => {
            clearTimeout(timeout);
            driverRef.current?.destroy();
        };
    }, [force, onComplete]);

    return null; // This component renders nothing — it's behavior only
}

/** Helper: check if onboarding has been completed */
export const hasCompletedOnboarding = () => !!localStorage.getItem(TOUR_KEY);

/** Helper: reset onboarding so it shows again */
export const resetOnboarding = () => localStorage.removeItem(TOUR_KEY);
