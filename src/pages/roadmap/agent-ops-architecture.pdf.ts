export const GET = () =>
	new Response(null, {
		status: 302,
		headers: {
			Location: '/roadmap/agent-ops-architecture.html',
		},
	});
