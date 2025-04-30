import { parseJwt } from '@cfworker/jwt';
import { Env } from '../context-env';

const API_BASE_URL = 'https://api-devs-8a32c93f7e2d.herokuapp.com';

async function getToken(context, code: string, client_secret: string) {
  return fetch(
    context.env.VIM_TOKEN_ENDPOINT ?? "https://api.getvim.com/v1/oauth/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: context.env.CLIENT_ID,
        code,
        client_secret,
        grant_type: "authorization_code",
      }),
    }
  );
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { code } = await context.request.json<{ code: string }>();
  let vimResponse = await getToken(context, code, context.env.CLIENT_SECRET);
  if (
    vimResponse.status >= 400 &&
    vimResponse.status < 500 &&
    context.env.CLIENT_SECRET_FALLBACK
  ) {
    vimResponse = await getToken(
      context,
      code,
      context.env.CLIENT_SECRET_FALLBACK
    );
  }
  const tokenData = await vimResponse.json();
  if (
    !(await isAuthorized(
      tokenData,
      context.env.CLIENT_ID,
      context.env.VIM_ISSUER
    ))
  ) {
    return new Response("", {
      status: 403,
      statusText: "Forbidden: You do not have access to this resource.",
    });
  }

  return Response.json(tokenData);
};

async function isAuthorized(
  vimTokenData,
  clientId: string,
  vimIssuer = "https://auth.getvim.com/"
) {
  try {
    const decodedIdToken = await parseJwt({
      jwt: vimTokenData.id_token,
      issuer: vimIssuer,
      audience: clientId,
    });
    if (decodedIdToken.valid) {
      // If identification data on token is not sufficient userinfo endpoint can be used...
      return await isUserEligibleToMyApp({
        email: decodedIdToken.payload["email"],
        vimUserId: decodedIdToken.payload["sub"],
        organization: decodedIdToken.payload["https://getvim.com/organization"],
      });
    } else if (decodedIdToken.valid === false) {
      console.error(
        `Failed to parse jwt ${decodedIdToken.reason} [${decodedIdToken.reasonCode}]`,
        {
          vimTokenData,
          vimIssuer,
          clientId,
        }
      );
      return false;
    }
  } catch (error) {
    console.error("Error verifying token", error);
    return false;
  }
}

async function isUserEligibleToMyApp({
	email,
	vimUserId,
	organization,
}: {
	email: string;
	vimUserId: string;
	organization: string;
}) {
	// check vimUserId as query in api call
	// build url:
	const url = new URL('/api/vim/check_user_is_eligible', API_BASE_URL);
	url.searchParams.set('vimUserId', vimUserId);
	if (email) url.searchParams.set('email', email);
	if (organization) url.searchParams.set('org', organization);

	const response = await fetch(url.toString(), {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		console.error('User not eligible', response.status);
		return false;
	}
	const { eligible } = await response.json<{ eligible: boolean }>();
	// console.log('eligible:', eligible);
	return eligible;
}
