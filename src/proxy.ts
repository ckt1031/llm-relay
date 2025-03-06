import { setResponseCORSHeaders } from "./headers";

export const proxyList = [
	{
		path: "/proxy/google-genai",
		host: "generativelanguage.googleapis.com",
	},
	{
		path: "/proxy/openai",
		host: "api.openai.com",
	},
	{
		path: "/proxy/anthropic",
		host: "api.anthropic.com",
	},
];

export const handleProxy = async (
	request: Request,
	path: string,
	host: string,
) => {
	const re = new RegExp(`^https?://.*${path}`);
	const url = request.url.replace(re, `https://${host}`);

	const headers = new Headers(request.headers);
	// Remove the host header to prevent DNS issue
	headers.delete("host");

	const modifiedRequest = new Request(url, {
		headers,
		method: request.method,
		body: request.body,
		redirect: "follow",
	});

	const response = await fetch(modifiedRequest);

	if (response.status === 404) {
		console.error("Proxy request failed with 404");

		const errorBody = {
			error: {
				message: "Not Found",
				type: "invalid_request_error",
				param: null,
				code: null,
			},
		};

		return Response.json(errorBody, { status: 404 });
	}
	
	try {
		const modifiedResponse = new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		});

		// Add CORS headers to the response
		return setResponseCORSHeaders(modifiedResponse);
	} catch (error) {
		if (error instanceof TypeError) {
			console.error("Error while fetching the response", error.message);
		}

		return new Response("Internal Server Error", { status: 500 });
	}
};
